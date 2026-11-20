const express = require('express')
const auth = require('../middleware/auth')
const Project = require('../models/Project')
const Proposal = require('../models/Proposal')
const Task = require('../models/Task')
const Milestone = require('../models/Milestone')
const TimeEntry = require('../models/TimeEntry')
const Invoice = require('../models/Invoice')
const { today, startOfWeek } = require('../utils/dates')

const router = express.Router()

const round2 = (n) => Math.round(n * 100) / 100

// months are grouped in this computer's time zone, not UTC
const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

// the last 6 months, oldest first, with paid totals filled in
async function revenueByMonth(freelancerId) {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const rows = await Invoice.aggregate([
    { $match: { freelancer: freelancerId, status: 'paid', paidAt: { $gte: from } } },
    {
      $group: {
        _id: {
          year: { $year: { date: '$paidAt', timezone: TIME_ZONE } },
          month: { $month: { date: '$paidAt', timezone: TIME_ZONE } }
        },
        revenue: { $sum: '$total' }
      }
    }
  ])

  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const row = rows.find((r) => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1)
    months.push({
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      year: d.getFullYear(),
      revenue: row ? round2(row.revenue) : 0
    })
  }
  return months
}

router.get('/dashboard/freelancer', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'this dashboard is for freelancers' })
    }
    const me = req.user._id

    // paid vs unpaid totals in one pass
    const byStatus = await Invoice.aggregate([
      { $match: { freelancer: me } },
      { $group: { _id: '$status', total: { $sum: '$total' } } }
    ])
    const sumOf = (...statuses) => round2(byStatus.filter((s) => statuses.includes(s._id)).reduce((n, s) => n + s.total, 0))

    const [hours] = await TimeEntry.aggregate([
      { $match: { user: me, date: { $gte: startOfWeek() } } },
      { $group: { _id: null, total: { $sum: '$hours' } } }
    ])

    const activeProjects = await Project.find({ freelancer: me, status: 'active' }, 'title deadline')

    // open milestones and project deadlines, soonest first
    const openMilestones = await Milestone.find({
      project: { $in: activeProjects.map((p) => p._id) },
      completed: false,
      dueDate: { $ne: null }
    })
    const now = today()
    const deadlines = [
      ...openMilestones.map((m) => ({
        type: 'milestone',
        title: m.title,
        project: activeProjects.find((p) => p._id.equals(m.project)),
        date: m.dueDate
      })),
      ...activeProjects
        .filter((p) => p.deadline)
        .map((p) => ({ type: 'project', title: 'Project deadline', project: p, date: p.deadline }))
    ]
      .sort((a, b) => a.date - b.date)
      .slice(0, 5)
      .map((d) => ({
        type: d.type,
        title: d.title,
        project: { _id: d.project._id, title: d.project.title },
        date: d.date,
        overdue: d.date < now
      }))

    res.json({
      totalEarned: sumOf('paid'),
      unpaidTotal: sumOf('unpaid', 'overdue'),
      activeProjects: activeProjects.length,
      hoursThisWeek: round2(hours ? hours.total : 0),
      revenueByMonth: await revenueByMonth(me),
      upcomingDeadlines: deadlines
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

router.get('/dashboard/client', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'this dashboard is for clients' })
    }
    const me = req.user._id

    const projects = await Project.find({ client: me })
      .populate('freelancer', 'name')
      .sort({ createdAt: -1 })
    const projectIds = projects.map((p) => p._id)

    // done / total tasks per project
    const taskCounts = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: '$project',
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } }
        }
      }
    ])

    const pendingProposals = await Proposal.find({ project: { $in: projectIds }, status: 'pending' })
      .populate('project', 'title')
      .sort({ createdAt: -1 })

    await Invoice.updateMany({ client: me, status: 'unpaid', dueDate: { $lt: today() } }, { status: 'overdue' })
    const unpaidInvoices = await Invoice.find({ client: me, status: { $in: ['unpaid', 'overdue'] } })
      .populate('project', 'title')
      .sort({ dueDate: 1 })

    res.json({
      activeProjects: projects.filter((p) => p.status === 'active').length,
      projects: projects.map((p) => {
        const counts = taskCounts.find((t) => t._id.equals(p._id))
        return {
          _id: p._id,
          title: p.title,
          status: p.status,
          deadline: p.deadline,
          freelancer: p.freelancer,
          progress: counts ? Math.round((counts.done / counts.total) * 100) : 0
        }
      }),
      pendingProposals,
      unpaidInvoices,
      unpaidTotal: round2(unpaidInvoices.reduce((n, inv) => n + inv.total, 0))
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

module.exports = router
