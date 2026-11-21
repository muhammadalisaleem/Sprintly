// API tests for time, invoices, chat, upload, dashboard, notifications and socket.io.
// Run with: npm test
// Starts a throwaway MongoDB in memory and the real server.js on a free port,
// so nothing touches your real database.

const { test, before, after, describe } = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const net = require('node:net')
const fs = require('node:fs')
const path = require('node:path')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const { io: connectSocket } = require('socket.io-client')

const User = require('../models/User')
const Project = require('../models/Project')
const Proposal = require('../models/Proposal')
const Task = require('../models/Task')
const Milestone = require('../models/Milestone')
const TimeEntry = require('../models/TimeEntry')
const Invoice = require('../models/Invoice')
const Notification = require('../models/Notification')
const { toDay } = require('../utils/dates')

let mongo
let server
let BASE
const uploadedFiles = []

// ---------- helpers ----------

function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer()
    s.listen(0, () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
  })
}

async function api(method, url, token, body) {
  const headers = {}
  if (token) headers.Authorization = 'Bearer ' + token
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(BASE + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { status: res.status, body: data, headers: res.headers }
}

async function uploadFile(token, name, content) {
  const form = new FormData()
  form.append('file', new Blob([content]), name)
  const res = await fetch(BASE + '/api/upload', {
    method: 'POST',
    headers: token ? { Authorization: 'Bearer ' + token } : {},
    body: form
  })
  const body = await res.json()
  if (body.fileUrl) uploadedFiles.push(path.basename(body.fileUrl))
  return { status: res.status, body }
}

async function register(name, email, role) {
  const res = await api('POST', '/api/auth/register', null, { name, email, password: '123456', role })
  assert.equal(res.status, 200, JSON.stringify(res.body))
  return { token: res.body.token, id: res.body.user._id }
}

function daysFromToday(n) {
  const d = toDay()
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

const ymd = (d) => d.toISOString().slice(0, 10)

// ---------- setup ----------

const u = {} // users: sara, bilal (freelancers), hamza, usman (clients)
const p = {} // projects
const m = {} // milestones
const t = {} // tasks
const entryIds = {} // time entries made in the time tests, billed in the invoice tests

before(async () => {
  mongo = await MongoMemoryServer.create()
  const uri = mongo.getUri('sprintly-test')
  const port = await freePort()
  BASE = `http://127.0.0.1:${port}`

  server = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), MONGO_URI: uri, JWT_SECRET: 'test-secret' },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  // wait until the server is listening and connected to mongo
  await new Promise((resolve, reject) => {
    let out = ''
    const timer = setTimeout(() => reject(new Error('server did not start:\n' + out)), 20000)
    const onData = (chunk) => {
      out += chunk
      if (out.includes('server running') && out.includes('mongodb connected')) {
        clearTimeout(timer)
        resolve()
      }
    }
    server.stdout.on('data', onData)
    server.stderr.on('data', (chunk) => { out += chunk })
    server.on('exit', (code) => reject(new Error('server exited ' + code + '\n' + out)))
  })

  await mongoose.connect(uri)

  Object.assign(u, {
    sara: await register('Sara Khan', 'sara@test.dev', 'freelancer'),
    bilal: await register('Bilal Ahmed', 'bilal@test.dev', 'freelancer'),
    hamza: await register('Hamza Malik', 'hamza@test.dev', 'client'),
    usman: await register('Usman Tariq', 'usman@test.dev', 'client')
  })
  await User.updateOne({ _id: u.sara.id }, { hourlyRate: 40 })

  // projects, tasks and milestones are Ali's APIs, so they go straight into the db here
  p.main = await Project.create({ title: 'E-commerce website', freelancer: u.sara.id, client: u.hamza.id, budget: 3000, deadline: daysFromToday(40), status: 'active' })
  p.pending = await Project.create({ title: 'Booking system', freelancer: u.sara.id, client: u.hamza.id, budget: 2500, deadline: daysFromToday(90), status: 'proposal' })
  p.other = await Project.create({ title: 'Brand identity', freelancer: u.bilal.id, client: u.usman.id, budget: 900, deadline: daysFromToday(20), status: 'active' })

  await Proposal.create({ project: p.pending._id, scope: 'Booking flow', amount: 2500, timeline: '3 months', status: 'pending' })

  m.done = await Milestone.create({ project: p.main._id, title: 'Design mockups', dueDate: daysFromToday(-10), amount: 600, completed: true })
  m.open = await Milestone.create({ project: p.main._id, title: 'Frontend pages', dueDate: daysFromToday(5), amount: 1200, completed: false })
  m.late = await Milestone.create({ project: p.main._id, title: 'Copy review', dueDate: daysFromToday(-2), amount: 100, completed: false })
  m.otherDone = await Milestone.create({ project: p.other._id, title: 'Logo', dueDate: daysFromToday(-5), amount: 400, completed: true })

  t.a = await Task.create({ project: p.main._id, title: 'Homepage', status: 'done' })
  t.b = await Task.create({ project: p.main._id, title: 'Product page', status: 'doing' })
  t.c = await Task.create({ project: p.main._id, title: 'Cart', status: 'todo' })
  t.other = await Task.create({ project: p.other._id, title: 'Sketches', status: 'todo' })
})

after(async () => {
  await mongoose.disconnect()
  if (server) server.kill()
  if (mongo) await mongo.stop()
  const dir = path.join(__dirname, '..', 'uploads')
  for (const f of uploadedFiles) fs.rmSync(path.join(dir, f), { force: true })
})

// ---------- tests ----------

describe('login is required', () => {
  const routes = [
    ['GET', '/api/time'],
    ['GET', '/api/invoices'],
    ['POST', '/api/invoices'],
    ['GET', '/api/dashboard/freelancer'],
    ['GET', '/api/dashboard/client'],
    ['POST', '/api/upload']
  ]
  for (const [method, url] of routes) {
    test(`${method} ${url} without a token is 401`, async () => {
      const res = await api(method, url)
      assert.equal(res.status, 401)
    })
  }

  test('a fake token is 401', async () => {
    const res = await api('GET', '/api/time', 'not-a-real-token')
    assert.equal(res.status, 401)
  })
})

describe('time API', () => {
  test('freelancer logs time manually', async () => {
    const res = await api('POST', `/api/projects/${p.main._id}/time`, u.sara.token, {
      hours: 2.5, date: ymd(daysFromToday(0)), note: '  Product page layout  ', task: t.b._id
    })
    assert.equal(res.status, 201, JSON.stringify(res.body))
    assert.equal(res.body.hours, 2.5)
    assert.equal(res.body.note, 'Product page layout')
    assert.equal(res.body.invoiced, false)
    assert.equal(res.body.user, u.sara.id)
    entryIds.today = res.body._id
  })

  test('timer entry without a date is saved for today, hours rounded', async () => {
    const res = await api('POST', `/api/projects/${p.main._id}/time`, u.sara.token, { hours: 0.016666, note: 'Timer' })
    assert.equal(res.status, 201)
    assert.equal(res.body.hours, 0.02)
    assert.equal(ymd(new Date(res.body.date)), ymd(toDay()))
    entryIds.timer = res.body._id
  })

  test('time from 10 days ago is saved on that day', async () => {
    const res = await api('POST', `/api/projects/${p.main._id}/time`, u.sara.token, { hours: 4, date: ymd(daysFromToday(-10)), note: 'Wireframes' })
    assert.equal(res.status, 201)
    assert.equal(ymd(new Date(res.body.date)), ymd(daysFromToday(-10)))
    entryIds.old = res.body._id
  })

  for (const hours of [0, -1, 25, 'abc', null]) {
    test(`hours = ${JSON.stringify(hours)} is rejected`, async () => {
      const res = await api('POST', `/api/projects/${p.main._id}/time`, u.sara.token, { hours })
      assert.equal(res.status, 400)
    })
  }

  test('an invalid date is rejected', async () => {
    const res = await api('POST', `/api/projects/${p.main._id}/time`, u.sara.token, { hours: 1, date: 'not-a-date' })
    assert.equal(res.status, 400)
  })

  test('a task from another project is rejected', async () => {
    const res = await api('POST', `/api/projects/${p.main._id}/time`, u.sara.token, { hours: 1, task: t.other._id })
    assert.equal(res.status, 400)
  })

  test('the client cannot log time', async () => {
    const res = await api('POST', `/api/projects/${p.main._id}/time`, u.hamza.token, { hours: 1 })
    assert.equal(res.status, 403)
  })

  test('someone outside the project gets 404', async () => {
    const res = await api('POST', `/api/projects/${p.main._id}/time`, u.bilal.token, { hours: 1 })
    assert.equal(res.status, 404)
    const list = await api('GET', `/api/projects/${p.main._id}/time`, u.usman.token)
    assert.equal(list.status, 404)
  })

  test('time cannot be logged before the proposal is accepted', async () => {
    const res = await api('POST', `/api/projects/${p.pending._id}/time`, u.sara.token, { hours: 1 })
    assert.equal(res.status, 400)
  })

  test('a bad project id gets 404, not a crash', async () => {
    const res = await api('GET', '/api/projects/abc/time', u.sara.token)
    assert.equal(res.status, 404)
  })

  test('both members see the project entries and total hours', async () => {
    for (const who of [u.sara, u.hamza]) {
      const res = await api('GET', `/api/projects/${p.main._id}/time`, who.token)
      assert.equal(res.status, 200)
      assert.equal(res.body.entries.length, 3)
      assert.equal(res.body.totalHours, 6.52)
      assert.equal(res.body.entries[0].user.name, 'Sara Khan')
    }
  })

  test('GET /time lists only my own entries with project titles', async () => {
    await api('POST', `/api/projects/${p.other._id}/time`, u.bilal.token, { hours: 3, note: 'Bilal work' })
    const res = await api('GET', '/api/time', u.sara.token)
    assert.equal(res.status, 200)
    assert.equal(res.body.length, 3)
    assert.ok(res.body.every((e) => e.project.title === 'E-commerce website'))
  })

  test('nobody else can delete my entry', async () => {
    const res = await api('DELETE', `/api/time/${entryIds.timer}`, u.bilal.token)
    assert.equal(res.status, 404)
  })

  test('I can delete my own entry', async () => {
    const res = await api('DELETE', `/api/time/${entryIds.timer}`, u.sara.token)
    assert.equal(res.status, 200)
    assert.equal(await TimeEntry.exists({ _id: entryIds.timer }), null)
  })

  test('deleting an unknown entry gets 404', async () => {
    const res = await api('DELETE', `/api/time/${entryIds.timer}`, u.sara.token)
    assert.equal(res.status, 404)
  })
})

describe('invoices API', () => {
  let invoice
  let extra = [] // invoices added straight to the db, removed after the numbering test

  test('a client cannot create an invoice', async () => {
    const res = await api('POST', '/api/invoices', u.hamza.token, { project: p.main._id, dueDate: ymd(daysFromToday(14)), items: [{ description: 'x', qty: 1, rate: 10 }] })
    assert.equal(res.status, 403)
  })

  test('an invoice without lines is rejected', async () => {
    const res = await api('POST', '/api/invoices', u.sara.token, { project: p.main._id, dueDate: ymd(daysFromToday(14)) })
    assert.equal(res.status, 400)
  })

  test('an invoice without a due date is rejected', async () => {
    const res = await api('POST', '/api/invoices', u.sara.token, { project: p.main._id, items: [{ description: 'x', qty: 1, rate: 10 }] })
    assert.equal(res.status, 400)
  })

  for (const [label, item] of [
    ['no description', { description: '  ', qty: 1, rate: 10 }],
    ['qty 0', { description: 'x', qty: 0, rate: 10 }],
    ['negative rate', { description: 'x', qty: 1, rate: -5 }],
    ['text qty', { description: 'x', qty: 'two', rate: 10 }]
  ]) {
    test(`a line with ${label} is rejected`, async () => {
      const res = await api('POST', '/api/invoices', u.sara.token, { project: p.main._id, dueDate: ymd(daysFromToday(14)), items: [item] })
      assert.equal(res.status, 400)
    })
  }

  test('a milestone that is not completed is rejected', async () => {
    const res = await api('POST', '/api/invoices', u.sara.token, { project: p.main._id, dueDate: ymd(daysFromToday(14)), milestones: [m.open._id] })
    assert.equal(res.status, 400)
  })

  test("another freelancer's time entry is rejected", async () => {
    const bilalEntry = await TimeEntry.findOne({ user: u.bilal.id })
    const res = await api('POST', '/api/invoices', u.sara.token, { project: p.main._id, dueDate: ymd(daysFromToday(14)), timeEntries: [bilalEntry._id] })
    assert.equal(res.status, 400)
  })

  test("I cannot bill someone else's project", async () => {
    const res = await api('POST', '/api/invoices', u.sara.token, { project: p.other._id, dueDate: ymd(daysFromToday(14)), items: [{ description: 'x', qty: 1, rate: 10 }] })
    assert.equal(res.status, 404)
  })

  test('I cannot bill a project still at proposal stage', async () => {
    const res = await api('POST', '/api/invoices', u.sara.token, { project: p.pending._id, dueDate: ymd(daysFromToday(14)), items: [{ description: 'x', qty: 1, rate: 10 }] })
    assert.equal(res.status, 400)
  })

  test('creates an invoice from time, a milestone and a typed line; the server sets the total', async () => {
    const res = await api('POST', '/api/invoices', u.sara.token, {
      project: p.main._id,
      dueDate: ymd(daysFromToday(14)),
      timeEntries: [entryIds.today, entryIds.old, entryIds.today], // duplicate on purpose
      milestones: [m.done._id],
      items: [{ description: 'Domain name', qty: 2, rate: 12.5, amount: 99999 }],
      total: 1,
      status: 'paid'
    })
    assert.equal(res.status, 201, JSON.stringify(res.body))
    invoice = res.body
    // 2.5h + 4h at $40 = 260, milestone 600, typed 2 x 12.5 = 25
    assert.equal(invoice.total, 885)
    assert.equal(invoice.items.length, 4)
    assert.equal(invoice.items.find((i) => i.description === 'Domain name').amount, 25)
    assert.ok(invoice.items.some((i) => i.description === 'Milestone: Design mockups' && i.amount === 600))
    assert.ok(invoice.items.some((i) => i.description === 'Product page layout (2.5 h)' && i.rate === 40))
    assert.equal(invoice.status, 'unpaid')
    assert.equal(invoice.number, 'INV-001')
    assert.equal(invoice.client.name, 'Hamza Malik')
    assert.equal(invoice.project.title, 'E-commerce website')
  })

  test('billed time entries are marked invoiced and cannot be billed or deleted again', async () => {
    const entries = await TimeEntry.find({ _id: { $in: [entryIds.today, entryIds.old] } })
    assert.ok(entries.every((e) => e.invoiced))

    const again = await api('POST', '/api/invoices', u.sara.token, { project: p.main._id, dueDate: ymd(daysFromToday(14)), timeEntries: [entryIds.today] })
    assert.equal(again.status, 400)

    const del = await api('DELETE', `/api/time/${entryIds.today}`, u.sara.token)
    assert.equal(del.status, 400)
  })

  test('a milestone cannot be billed twice', async () => {
    const res = await api('POST', '/api/invoices', u.sara.token, { project: p.main._id, dueDate: ymd(daysFromToday(14)), milestones: [m.done._id] })
    assert.equal(res.status, 400)
  })

  test('invoice numbers go up', async () => {
    const res = await api('POST', '/api/invoices', u.sara.token, { project: p.main._id, dueDate: ymd(daysFromToday(30)), items: [{ description: 'Hosting', qty: 1, rate: 50 }] })
    assert.equal(res.status, 201)
    assert.equal(res.body.number, 'INV-002')
  })

  test('both sides see the invoice in their list, outsiders see nothing', async () => {
    const mine = await api('GET', '/api/invoices', u.sara.token)
    const theirs = await api('GET', '/api/invoices', u.hamza.token)
    const outsider = await api('GET', '/api/invoices', u.usman.token)
    assert.equal(mine.body.length, 2)
    assert.equal(theirs.body.length, 2)
    assert.equal(outsider.body.length, 0)
  })

  test('filter by status and project works', async () => {
    const unpaid = await api('GET', '/api/invoices?status=unpaid', u.sara.token)
    assert.equal(unpaid.body.length, 2)
    const paid = await api('GET', '/api/invoices?status=paid', u.sara.token)
    assert.equal(paid.body.length, 0)
    const other = await api('GET', `/api/invoices?project=${p.other._id}`, u.sara.token)
    assert.equal(other.body.length, 0)
    const bad = await api('GET', '/api/invoices?project=junk', u.sara.token)
    assert.equal(bad.status, 200)
  })

  test('only the two sides can open an invoice', async () => {
    assert.equal((await api('GET', `/api/invoices/${invoice._id}`, u.sara.token)).status, 200)
    assert.equal((await api('GET', `/api/invoices/${invoice._id}`, u.hamza.token)).status, 200)
    assert.equal((await api('GET', `/api/invoices/${invoice._id}`, u.bilal.token)).status, 404)
    assert.equal((await api('GET', '/api/invoices/not-an-id', u.sara.token)).status, 404)
  })

  test('the freelancer cannot mark their own invoice as paid', async () => {
    const res = await api('PATCH', `/api/invoices/${invoice._id}/pay`, u.sara.token)
    assert.equal(res.status, 403)
  })

  test('an outsider cannot mark it paid', async () => {
    const res = await api('PATCH', `/api/invoices/${invoice._id}/pay`, u.usman.token)
    assert.equal(res.status, 404)
  })

  test('the client marks it paid, only once', async () => {
    const res = await api('PATCH', `/api/invoices/${invoice._id}/pay`, u.hamza.token)
    assert.equal(res.status, 200)
    assert.equal(res.body.status, 'paid')
    assert.ok(res.body.paidAt)

    const again = await api('PATCH', `/api/invoices/${invoice._id}/pay`, u.hamza.token)
    assert.equal(again.status, 400)
  })

  test('unpaid invoices past their due date show as overdue; paid ones stay paid', async () => {
    const late = await Invoice.create({ number: 'INV-050', project: p.main._id, freelancer: u.sara.id, client: u.hamza.id, items: [{ description: 'Old work', qty: 1, rate: 300, amount: 300 }], total: 300, dueDate: daysFromToday(-3) })
    const dueToday = await Invoice.create({ number: 'INV-051', project: p.main._id, freelancer: u.sara.id, client: u.hamza.id, items: [{ description: 'Today', qty: 1, rate: 10, amount: 10 }], total: 10, dueDate: daysFromToday(0) })
    await Invoice.updateOne({ _id: invoice._id }, { dueDate: daysFromToday(-5) })

    const overdue = await api('GET', '/api/invoices?status=overdue', u.hamza.token)
    assert.deepEqual(overdue.body.map((i) => i.number), ['INV-050'])

    const one = await api('GET', `/api/invoices/${dueToday._id}`, u.sara.token)
    assert.equal(one.body.status, 'unpaid')

    const paid = await api('GET', `/api/invoices/${invoice._id}`, u.sara.token)
    assert.equal(paid.body.status, 'paid')

    // an overdue invoice can still be paid
    const pay = await api('PATCH', `/api/invoices/${late._id}/pay`, u.hamza.token)
    assert.equal(pay.status, 200)
    extra = [late._id, dueToday._id]
  })

  test('the next number skips past the highest one used', async () => {
    const res = await api('POST', '/api/invoices', u.sara.token, { project: p.main._id, dueDate: ymd(daysFromToday(30)), items: [{ description: 'Support', qty: 1, rate: 20 }] })
    extra.push(res.body._id)
    assert.equal(res.body.number, 'INV-052')
    await Invoice.deleteMany({ _id: { $in: extra } })
  })
})

describe('upload and chat API', () => {
  let fileUrl

  test('upload needs a file', async () => {
    const res = await fetch(BASE + '/api/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + u.sara.token } })
    assert.equal(res.status, 400)
  })

  test('html and svg files are refused', async () => {
    assert.equal((await uploadFile(u.sara.token, 'evil.html', '<script>alert(1)</script>')).status, 400)
    assert.equal((await uploadFile(u.sara.token, 'evil.svg', '<svg onload="alert(1)"/>')).status, 400)
  })

  test('files over 10 MB are refused', async () => {
    const res = await uploadFile(u.sara.token, 'big.pdf', Buffer.alloc(10 * 1024 * 1024 + 1))
    assert.equal(res.status, 400)
  })

  test('a png uploads and can be downloaded again', async () => {
    const res = await uploadFile(u.sara.token, 'homepage mockup.png', 'fake png bytes')
    assert.equal(res.status, 201)
    assert.equal(res.body.fileName, 'homepage mockup.png')
    assert.match(res.body.fileUrl, /\/uploads\/\d+-[0-9a-f]+\.png$/)
    fileUrl = res.body.fileUrl

    const file = await fetch(fileUrl)
    assert.equal(file.status, 200)
    assert.equal(await file.text(), 'fake png bytes')
    assert.equal(file.headers.get('x-content-type-options'), 'nosniff')
  })

  test('both members can send messages; history comes back oldest first', async () => {
    const a = await api('POST', `/api/projects/${p.main._id}/messages`, u.hamza.token, { text: 'Hi Sara!' })
    assert.equal(a.status, 201)
    assert.equal(a.body.sender.name, 'Hamza Malik')

    const b = await api('POST', `/api/projects/${p.main._id}/messages`, u.sara.token, { text: 'Here are the mockups', fileUrl, fileName: 'homepage mockup.png' })
    assert.equal(b.status, 201)
    assert.equal(b.body.fileName, 'homepage mockup.png')

    const history = await api('GET', `/api/projects/${p.main._id}/messages`, u.hamza.token)
    assert.equal(history.status, 200)
    assert.deepEqual(history.body.map((x) => x.text), ['Hi Sara!', 'Here are the mockups'])
  })

  test('a file-only message works', async () => {
    const res = await api('POST', `/api/projects/${p.main._id}/messages`, u.sara.token, { fileUrl })
    assert.equal(res.status, 201)
    assert.equal(res.body.text, '')
    assert.equal(res.body.fileName, 'file')
  })

  test('empty and too-long messages are refused', async () => {
    assert.equal((await api('POST', `/api/projects/${p.main._id}/messages`, u.sara.token, { text: '   ' })).status, 400)
    assert.equal((await api('POST', `/api/projects/${p.main._id}/messages`, u.sara.token, { text: 'x'.repeat(2001) })).status, 400)
  })

  test('links that are not our uploads are refused', async () => {
    for (const bad of ['javascript:alert(1)', 'https://evil.com/steal', '/uploads/../server.js']) {
      const res = await api('POST', `/api/projects/${p.main._id}/messages`, u.sara.token, { text: 'look', fileUrl: bad })
      assert.equal(res.status, 400, bad)
    }
  })

  test('outsiders cannot read or post in the chat', async () => {
    assert.equal((await api('GET', `/api/projects/${p.main._id}/messages`, u.usman.token)).status, 404)
    assert.equal((await api('POST', `/api/projects/${p.main._id}/messages`, u.bilal.token, { text: 'hi' })).status, 404)
  })
})

describe('dashboard API', () => {
  test('a client cannot open the freelancer dashboard and vice versa', async () => {
    assert.equal((await api('GET', '/api/dashboard/freelancer', u.hamza.token)).status, 403)
    assert.equal((await api('GET', '/api/dashboard/client', u.sara.token)).status, 403)
  })

  test('freelancer dashboard numbers match the database', async () => {
    const res = await api('GET', '/api/dashboard/freelancer', u.sara.token)
    assert.equal(res.status, 200)
    const d = res.body

    // INV-001 paid 885, INV-002 unpaid 50
    assert.equal(d.totalEarned, 885)
    assert.equal(d.unpaidTotal, 50)
    assert.equal(d.activeProjects, 1)
    // only the 2.5h logged today counts; the 4h was 10 days ago
    assert.equal(d.hoursThisWeek, 2.5)

    assert.equal(d.revenueByMonth.length, 6)
    assert.equal(d.revenueByMonth[5].revenue, 885)
    assert.equal(d.revenueByMonth[5].month, new Date().toLocaleDateString('en-US', { month: 'short' }))
    assert.ok(d.revenueByMonth.slice(0, 5).every((x) => x.revenue === 0))

    // open milestones + project deadline, soonest first, completed ones left out
    assert.deepEqual(d.upcomingDeadlines.map((x) => x.title), ['Copy review', 'Frontend pages', 'Project deadline'])
    assert.equal(d.upcomingDeadlines[0].overdue, true)
    assert.equal(d.upcomingDeadlines[1].overdue, false)
    assert.equal(d.upcomingDeadlines[0].project.title, 'E-commerce website')
  })

  test('an overdue invoice counts as unpaid on the dashboard', async () => {
    const late = await Invoice.create({ number: 'INV-060', project: p.main._id, freelancer: u.sara.id, client: u.hamza.id, items: [{ description: 'Late', qty: 1, rate: 100, amount: 100 }], total: 100, status: 'overdue', dueDate: daysFromToday(-1) })
    const res = await api('GET', '/api/dashboard/freelancer', u.sara.token)
    assert.equal(res.body.unpaidTotal, 150)
    await Invoice.deleteOne({ _id: late._id })
  })

  test('a brand new freelancer gets zeros, not errors', async () => {
    const res = await api('GET', '/api/dashboard/freelancer', u.bilal.token)
    assert.equal(res.status, 200)
    assert.equal(res.body.totalEarned, 0)
    assert.equal(res.body.hoursThisWeek, 3)
    assert.equal(res.body.upcomingDeadlines.length, 1)
  })

  test('client dashboard shows projects with progress, pending proposals and unpaid invoices', async () => {
    const res = await api('GET', '/api/dashboard/client', u.hamza.token)
    assert.equal(res.status, 200)
    const d = res.body

    assert.equal(d.activeProjects, 1)
    assert.equal(d.projects.length, 2)
    const main = d.projects.find((x) => x.title === 'E-commerce website')
    assert.equal(main.progress, 33) // 1 of 3 tasks done
    assert.equal(main.freelancer.name, 'Sara Khan')
    assert.equal(d.projects.find((x) => x.title === 'Booking system').progress, 0)

    assert.equal(d.pendingProposals.length, 1)
    assert.equal(d.pendingProposals[0].project.title, 'Booking system')

    assert.deepEqual(d.unpaidInvoices.map((i) => i.number), ['INV-002'])
    assert.equal(d.unpaidTotal, 50)
  })

  test('another client sees only their own things', async () => {
    const res = await api('GET', '/api/dashboard/client', u.usman.token)
    assert.equal(res.body.projects.length, 1)
    assert.equal(res.body.projects[0].title, 'Brand identity')
    assert.equal(res.body.unpaidInvoices.length, 0)
  })
})

describe('notifications API', () => {
  test('creating and paying an invoice notifies the other side', async () => {
    const inv = await Invoice.findOne({ number: 'INV-001' })
    const hamza = await api('GET', '/api/notifications', u.hamza.token)
    assert.ok(hamza.body.notifications.some((n) => n.text === 'Sara Khan sent you invoice INV-001' && n.link === `/invoices/${inv._id}`))

    const sara = await api('GET', '/api/notifications', u.sara.token)
    assert.ok(sara.body.notifications.some((n) => n.text === 'Hamza Malik paid invoice INV-001'))
  })

  test('a chat message notifies the other member, not the sender', async () => {
    const sara = await api('GET', '/api/notifications', u.sara.token)
    assert.ok(sara.body.notifications.some((n) => n.text === 'Hamza Malik sent a new message on E-commerce website' && n.link === `/chat?project=${p.main._id}`))
    const hamza = await api('GET', '/api/notifications', u.hamza.token)
    assert.ok(hamza.body.notifications.some((n) => n.text === 'Sara Khan sent a new message on E-commerce website'))
    assert.ok(!hamza.body.notifications.some((n) => n.text.startsWith('Hamza Malik')))
  })

  test('I only see my own notifications, newest first, with the unread count', async () => {
    const res = await api('GET', '/api/notifications', u.hamza.token)
    assert.equal(res.status, 200)
    assert.ok(res.body.notifications.length > 0)
    assert.ok(res.body.notifications.every((n) => n.user === u.hamza.id))
    const dates = res.body.notifications.map((n) => new Date(n.createdAt).getTime())
    assert.deepEqual(dates, [...dates].sort((x, y) => y - x))
    assert.equal(res.body.unreadCount, res.body.notifications.filter((n) => !n.read).length)

    const nobody = await api('GET', '/api/notifications', u.usman.token)
    assert.deepEqual(nobody.body, { notifications: [], unreadCount: 0 })
  })

  test('I cannot mark another person\'s notification as read', async () => {
    const theirs = await Notification.findOne({ user: u.hamza.id })
    const res = await api('PATCH', `/api/notifications/${theirs._id}/read`, u.sara.token)
    assert.equal(res.status, 404)
    assert.equal((await Notification.findById(theirs._id)).read, false)
    assert.equal((await api('PATCH', '/api/notifications/junk/read', u.sara.token)).status, 404)
  })

  test('mark one as read', async () => {
    const before = await api('GET', '/api/notifications', u.hamza.token)
    const first = before.body.notifications.find((n) => !n.read)
    const res = await api('PATCH', `/api/notifications/${first._id}/read`, u.hamza.token)
    assert.equal(res.status, 200)
    assert.equal(res.body.read, true)
    const after = await api('GET', '/api/notifications', u.hamza.token)
    assert.equal(after.body.unreadCount, before.body.unreadCount - 1)
  })

  test('mark all as read only touches my own', async () => {
    const saraBefore = (await api('GET', '/api/notifications', u.sara.token)).body.unreadCount
    const res = await api('PATCH', '/api/notifications/read-all', u.hamza.token)
    assert.equal(res.status, 200)
    assert.ok(res.body.updated > 0)
    assert.equal((await api('GET', '/api/notifications', u.hamza.token)).body.unreadCount, 0)
    assert.equal((await api('GET', '/api/notifications', u.sara.token)).body.unreadCount, saraBefore)
  })

  test('notifications need a login', async () => {
    assert.equal((await api('GET', '/api/notifications')).status, 401)
    assert.equal((await api('PATCH', '/api/notifications/read-all')).status, 401)
  })
})

describe('real-time (socket.io)', () => {
  const sockets = []

  function connect(token) {
    return new Promise((resolve, reject) => {
      const socket = connectSocket(BASE, {
        auth: token ? { token } : {},
        transports: ['websocket'],
        forceNew: true,
        reconnection: false
      })
      sockets.push(socket)
      socket.on('connect', () => resolve(socket))
      socket.on('connect_error', (err) => reject(err))
    })
  }

  // resolves with the event's data, or fails after a timeout
  function waitFor(socket, event, ms = 3000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('no ' + event + ' within ' + ms + 'ms')), ms)
      socket.once(event, (data) => {
        clearTimeout(timer)
        resolve(data)
      })
    })
  }

  // resolves true if the event did NOT arrive in time
  function staysQuiet(socket, event, ms = 700) {
    return new Promise((resolve) => {
      const onEvent = () => resolve(false)
      socket.once(event, onEvent)
      setTimeout(() => {
        socket.off(event, onEvent)
        resolve(true)
      }, ms)
    })
  }

  const join = (socket, projectId) => new Promise((resolve) => socket.emit('join', projectId, resolve))

  after(() => sockets.forEach((s) => s.disconnect()))

  test('connecting without a token is refused', async () => {
    await assert.rejects(connect(null), /no token/)
  })

  test('connecting with a fake token is refused', async () => {
    await assert.rejects(connect('fake.token.here'), /token is not valid/)
  })

  let sara, hamza, usman, bilal

  test('members can join their project room, outsiders cannot', async () => {
    ;[sara, hamza, usman, bilal] = await Promise.all([connect(u.sara.token), connect(u.hamza.token), connect(u.usman.token), connect(u.bilal.token)])
    assert.deepEqual(await join(sara, String(p.main._id)), { ok: true })
    assert.deepEqual(await join(hamza, String(p.main._id)), { ok: true })
    assert.equal((await join(usman, String(p.main._id))).ok, false)
    assert.equal((await join(bilal, 'not-an-id')).ok, false)
    assert.deepEqual(await join(bilal, String(p.other._id)), { ok: true })
  })

  test('join without a callback does not crash the server', async () => {
    usman.emit('join', String(p.main._id))
    const res = await api('GET', '/api/notifications', u.usman.token)
    assert.equal(res.status, 200)
  })

  test('a new message reaches everyone in the room instantly, and nobody else', async () => {
    const saraGets = waitFor(sara, 'message:new')
    const hamzaGets = waitFor(hamza, 'message:new')
    const usmanQuiet = staysQuiet(usman, 'message:new')
    const bilalQuiet = staysQuiet(bilal, 'message:new')

    const sent = await api('POST', `/api/projects/${p.main._id}/messages`, u.hamza.token, { text: 'Live hello' })
    assert.equal(sent.status, 201)

    const msg = await saraGets
    assert.equal(msg._id, sent.body._id)
    assert.equal(msg.text, 'Live hello')
    assert.equal(msg.sender.name, 'Hamza Malik')
    assert.equal((await hamzaGets)._id, sent.body._id) // the sender's other tabs update too
    assert.equal(await usmanQuiet, true)
    assert.equal(await bilalQuiet, true)
  })

  test('the other member gets a live notification for the message, the sender does not', async () => {
    const saraNote = waitFor(sara, 'notification:new')
    const hamzaQuiet = staysQuiet(hamza, 'notification:new')
    await api('POST', `/api/projects/${p.main._id}/messages`, u.hamza.token, { text: 'Ping' })
    const note = await saraNote
    assert.equal(note.text, 'Hamza Malik sent a new message on E-commerce website')
    assert.equal(note.user, u.sara.id)
    assert.equal(note.read, false)
    assert.equal(await hamzaQuiet, true)
  })

  test('the client gets a live notification when an invoice is sent, and the freelancer when it is paid', async () => {
    const hamzaNote = waitFor(hamza, 'notification:new')
    const bilalQuiet = staysQuiet(bilal, 'notification:new')
    const created = await api('POST', '/api/invoices', u.sara.token, { project: p.main._id, dueDate: ymd(daysFromToday(10)), items: [{ description: 'Live test', qty: 1, rate: 5 }] })
    assert.equal(created.status, 201)
    assert.equal((await hamzaNote).text, `Sara Khan sent you invoice ${created.body.number}`)
    assert.equal(await bilalQuiet, true)

    const saraNote = waitFor(sara, 'notification:new')
    await api('PATCH', `/api/invoices/${created.body._id}/pay`, u.hamza.token)
    assert.equal((await saraNote).text, `Hamza Malik paid invoice ${created.body.number}`)
    await Invoice.deleteOne({ _id: created.body._id })
  })

  test('after leaving the room, chat messages stop arriving', async () => {
    sara.emit('leave', String(p.main._id))
    await new Promise((r) => setTimeout(r, 100))
    const quiet = staysQuiet(sara, 'message:new')
    await api('POST', `/api/projects/${p.main._id}/messages`, u.hamza.token, { text: 'Anyone there?' })
    assert.equal(await quiet, true)
  })
})
