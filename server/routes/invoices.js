const express = require('express')
const auth = require('../middleware/auth')
const Invoice = require('../models/Invoice')
const TimeEntry = require('../models/TimeEntry')
const Milestone = require('../models/Milestone')
const { isValidId, getMemberProject } = require('../utils/access')
const { toDay, today } = require('../utils/dates')
const notify = require('../utils/notify')

const router = express.Router()

const round2 = (n) => Math.round(n * 100) / 100

// unpaid invoices whose due date has passed become overdue
async function markOverdue(filter) {
  await Invoice.updateMany(
    { ...filter, status: 'unpaid', dueDate: { $lt: today() } },
    { status: 'overdue' }
  )
}

// next number like INV-007
async function nextNumber() {
  const all = await Invoice.find({}, 'number')
  const max = all.reduce((n, inv) => Math.max(n, Number(inv.number.replace('INV-', '')) || 0), 0)
  return 'INV-' + String(max + 1).padStart(3, '0')
}

function populateInvoice(query) {
  return query
    .populate('project', 'title')
    .populate('freelancer', 'name email')
    .populate('client', 'name email')
}

// invoices I sent (freelancer) or received (client)
// optional filters: ?status=unpaid|paid|overdue&project=<id>
router.get('/invoices', auth, async (req, res) => {
  try {
    const mine = req.user.role === 'client' ? { client: req.user._id } : { freelancer: req.user._id }
    await markOverdue(mine)

    const filter = { ...mine }
    if (['unpaid', 'paid', 'overdue'].includes(req.query.status)) filter.status = req.query.status
    if (req.query.project) {
      if (!isValidId(req.query.project)) return res.json([])
      filter.project = req.query.project
    }

    const invoices = await populateInvoice(Invoice.find(filter)).sort({ createdAt: -1 })
    res.json(invoices)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// create an invoice (freelancer only)
// body: { project, dueDate, items: [{ description, qty, rate }], timeEntries: [ids], milestones: [ids] }
router.post('/invoices', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'only freelancers can create invoices' })
    }

    const { project: projectId, dueDate, items = [], timeEntries = [], milestones = [] } = req.body

    const project = await getMemberProject(projectId, req.user)
    if (!project || !project.freelancer.equals(req.user._id)) {
      return res.status(404).json({ message: 'project not found' })
    }
    if (project.status === 'proposal') {
      return res.status(400).json({ message: 'the client has not accepted the proposal yet' })
    }

    const due = dueDate ? toDay(dueDate) : null
    if (!due) {
      return res.status(400).json({ message: 'please pick a due date' })
    }

    if (!Array.isArray(items) || !Array.isArray(timeEntries) || !Array.isArray(milestones)) {
      return res.status(400).json({ message: 'items, timeEntries and milestones should be lists' })
    }

    const lineItems = []

    // typed lines
    for (const item of items) {
      const description = typeof item?.description === 'string' ? item.description.trim() : ''
      const qty = Number(item?.qty)
      const rate = Number(item?.rate)
      if (!description) return res.status(400).json({ message: 'every line needs a description' })
      if (!(qty > 0) || !(rate >= 0)) {
        return res.status(400).json({ message: 'quantity must be above 0 and rate cannot be negative' })
      }
      lineItems.push({ description, qty, rate, amount: round2(qty * rate) })
    }

    // lines from time entries: hours x my hourly rate
    const entryIds = [...new Set(timeEntries.map(String))]
    if (entryIds.length) {
      if (!entryIds.every(isValidId)) return res.status(400).json({ message: 'invalid time entry' })
      const entries = await TimeEntry.find({
        _id: { $in: entryIds },
        project: project._id,
        user: req.user._id,
        invoiced: false
      }).sort({ date: 1 })
      if (entries.length !== entryIds.length) {
        return res.status(400).json({ message: 'some time entries are already invoiced or not part of this project' })
      }
      for (const e of entries) {
        lineItems.push({
          description: `${e.note || 'Work'} (${e.hours} h)`,
          qty: e.hours,
          rate: req.user.hourlyRate,
          amount: round2(e.hours * req.user.hourlyRate),
          timeEntry: e._id
        })
      }
    }

    // lines from completed milestones that were not billed before
    const milestoneIds = [...new Set(milestones.map(String))]
    if (milestoneIds.length) {
      if (!milestoneIds.every(isValidId)) return res.status(400).json({ message: 'invalid milestone' })
      const found = await Milestone.find({ _id: { $in: milestoneIds }, project: project._id, completed: true })
      if (found.length !== milestoneIds.length) {
        return res.status(400).json({ message: 'milestones must be completed and part of this project' })
      }
      if (await Invoice.exists({ 'items.milestone': { $in: milestoneIds } })) {
        return res.status(400).json({ message: 'a milestone is already on another invoice' })
      }
      for (const m of found) {
        lineItems.push({ description: `Milestone: ${m.title}`, qty: 1, rate: m.amount, amount: m.amount, milestone: m._id })
      }
    }

    if (lineItems.length === 0) {
      return res.status(400).json({ message: 'add at least one line item' })
    }
    const total = round2(lineItems.reduce((sum, i) => sum + i.amount, 0))
    if (total <= 0) {
      return res.status(400).json({ message: 'the total must be more than 0' })
    }

    // retry if two invoices grab the same number at the same time
    let invoice
    for (let attempt = 0; !invoice; attempt++) {
      try {
        invoice = await Invoice.create({
          number: await nextNumber(),
          project: project._id,
          freelancer: req.user._id,
          client: project.client,
          items: lineItems,
          total,
          status: 'unpaid',
          dueDate: due
        })
      } catch (err) {
        if (err.code !== 11000 || attempt >= 2) throw err
      }
    }

    if (entryIds.length) {
      await TimeEntry.updateMany({ _id: { $in: entryIds } }, { invoiced: true })
    }

    await notify(project.client, `${req.user.name} sent you invoice ${invoice.number}`, `/invoices/${invoice._id}`)

    res.status(201).json(await populateInvoice(Invoice.findById(invoice._id)))
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// one invoice (only its freelancer and client can see it)
router.get('/invoices/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'invoice not found' })
    await markOverdue({ _id: req.params.id })

    const invoice = await populateInvoice(Invoice.findById(req.params.id))
    const allowed = invoice && (invoice.freelancer._id.equals(req.user._id) || invoice.client._id.equals(req.user._id))
    if (!allowed) return res.status(404).json({ message: 'invoice not found' })

    res.json(invoice)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// the client marks the invoice as paid
router.patch('/invoices/:id/pay', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'invoice not found' })

    const invoice = await Invoice.findById(req.params.id)
    if (!invoice || !(invoice.client.equals(req.user._id) || invoice.freelancer.equals(req.user._id))) {
      return res.status(404).json({ message: 'invoice not found' })
    }
    if (!invoice.client.equals(req.user._id)) {
      return res.status(403).json({ message: 'only the client can mark an invoice as paid' })
    }
    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'invoice is already paid' })
    }

    invoice.status = 'paid'
    invoice.paidAt = new Date()
    await invoice.save()

    await notify(invoice.freelancer, `${req.user.name} paid invoice ${invoice.number}`, `/invoices/${invoice._id}`)

    res.json(await populateInvoice(Invoice.findById(invoice._id)))
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

module.exports = router
