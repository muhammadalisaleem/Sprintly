// adds the demo users, projects, proposals, milestones and tasks to the database
// run with: node seed.js
// all of them have password 123456
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()
const User = require('./models/User')
const Project = require('./models/Project')
const Proposal = require('./models/Proposal')
const Milestone = require('./models/Milestone')
const Task = require('./models/Task')
const Review = require('./models/Review')
const TimeEntry = require('./models/TimeEntry')
const Invoice = require('./models/Invoice')
const Message = require('./models/Message')

const users = [
  { name: 'Sara Khan', email: 'sara@sprintly.dev', role: 'freelancer', bio: 'Full-stack developer who builds fast, clean web apps.', skills: ['React', 'Node.js', 'MongoDB'], hourlyRate: 40 },
  { name: 'Bilal Ahmed', email: 'bilal@sprintly.dev', role: 'freelancer', bio: 'Brand and UI designer.', skills: ['Figma', 'Branding', 'Illustration'], hourlyRate: 35 },
  { name: 'Hamza Malik', email: 'hamza@acme.com', role: 'client', bio: 'Owner of Acme Store.' },
  { name: 'Ayesha Raza', email: 'ayesha@fitapp.io', role: 'client', bio: 'Product manager at FitApp.' },
  { name: 'Usman Tariq', email: 'usman@spiceroute.pk', role: 'client', bio: 'Runs the Spice Route restaurant.' },
]

// freelancer and client are emails here, changed to ids below
const projects = [
  {
    title: 'E-commerce website', description: 'Online store for Acme with product pages, cart and checkout.',
    freelancer: 'sara@sprintly.dev', client: 'hamza@acme.com', budget: 3000, deadline: '2026-11-30', status: 'active',
    proposal: { scope: 'Design and build a full online store.', deliverables: ['Design mockups', 'Frontend pages', 'Payment integration'], amount: 3000, timeline: '4 months', status: 'accepted' }
  },
  {
    title: 'Mobile app landing page', description: 'Marketing landing page for the FitApp launch.',
    freelancer: 'sara@sprintly.dev', client: 'ayesha@fitapp.io', budget: 1200, deadline: '2026-11-10', status: 'active',
    proposal: { scope: 'One-page responsive landing page.', deliverables: ['Landing page design', 'Final build'], amount: 1200, timeline: '10 weeks', status: 'accepted' }
  },
  {
    title: 'Brand identity design', description: 'Logo, colours and brand guide for Spice Route.',
    freelancer: 'bilal@sprintly.dev', client: 'usman@spiceroute.pk', budget: 900, deadline: '2026-09-30', status: 'completed', completedAt: '2026-09-30',
    proposal: { scope: 'Complete brand identity.', deliverables: ['Logo concepts', 'Brand guide'], amount: 900, timeline: '5 weeks', status: 'accepted' }
  },
  {
    title: 'Restaurant booking system', description: 'Table booking website with an admin panel.',
    freelancer: 'sara@sprintly.dev', client: 'usman@spiceroute.pk', budget: 2500, deadline: '2027-01-15', status: 'proposal',
    proposal: { scope: 'Booking website with table management for staff.', deliverables: ['Booking flow', 'Admin panel', 'Email confirmations'], amount: 2500, timeline: '3 months', status: 'pending' }
  }
]

// milestones and tasks, by project title. task.milestone is the milestone title
const milestones = {
  'E-commerce website': [
    { title: 'Design mockups', dueDate: '2026-10-10', amount: 600, completed: true },
    { title: 'Frontend pages', dueDate: '2026-10-31', amount: 1200, completed: false },
    { title: 'Payment integration', dueDate: '2026-11-25', amount: 1200, completed: false }
  ],
  'Mobile app landing page': [
    { title: 'Landing page design', dueDate: '2026-10-20', amount: 400, completed: true },
    { title: 'Final build', dueDate: '2026-11-10', amount: 800, completed: false }
  ],
  'Brand identity design': [
    { title: 'Logo concepts', dueDate: '2026-09-05', amount: 400, completed: true },
    { title: 'Brand guide', dueDate: '2026-09-28', amount: 500, completed: true }
  ]
}

const tasks = {
  'E-commerce website': [
    { title: 'Homepage mockup', status: 'done', priority: 'high', dueDate: '2026-10-05', milestone: 'Design mockups' },
    { title: 'Product page', description: 'Gallery, price, add to cart.', status: 'doing', priority: 'high', dueDate: '2026-10-28', milestone: 'Frontend pages' },
    { title: 'Cart page', status: 'todo', priority: 'medium', dueDate: '2026-10-31', milestone: 'Frontend pages' },
    { title: 'Stripe checkout', status: 'todo', priority: 'medium', dueDate: '2026-11-20', milestone: 'Payment integration' }
  ],
  'Mobile app landing page': [
    { title: 'Hero section design', status: 'done', priority: 'high', dueDate: '2026-10-15', milestone: 'Landing page design' },
    { title: 'Build responsive layout', status: 'doing', priority: 'high', dueDate: '2026-11-01', milestone: 'Final build' },
    { title: 'Contact form', status: 'todo', priority: 'low', dueDate: '2026-11-08', milestone: 'Final build' }
  ],
  'Brand identity design': [
    { title: 'Three logo options', status: 'done', priority: 'high', dueDate: '2026-09-04', milestone: 'Logo concepts' },
    { title: 'Colour palette', status: 'done', priority: 'medium', dueDate: '2026-09-20', milestone: 'Brand guide' },
    { title: 'Brand guide PDF', status: 'done', priority: 'medium', dueDate: '2026-09-27', milestone: 'Brand guide' }
  ]
}

// reviews on the completed project, from and to are emails
const reviews = [
  { project: 'Brand identity design', from: 'usman@spiceroute.pk', to: 'bilal@sprintly.dev', rating: 5, comment: 'Creative, fast and easy to work with.' },
  { project: 'Brand identity design', from: 'bilal@sprintly.dev', to: 'usman@spiceroute.pk', rating: 4, comment: 'Clear feedback and paid on time.' }
]

// logged time, by project title. user is the freelancer of the project
const time = {
  'E-commerce website': [
    { date: '2026-11-10', hours: 5, note: 'Product gallery' },
    { date: '2026-11-17', hours: 4, note: 'Product page layout' },
    { date: '2026-11-19', hours: 3.5, note: 'Cart page' }
  ],
  'Mobile app landing page': [
    { date: '2026-11-18', hours: 2, note: 'Responsive fixes' }
  ]
}

// invoices for finished milestones. milestone titles get changed to lines below
const invoices = [
  { number: 'INV-001', project: 'Brand identity design', milestones: ['Logo concepts', 'Brand guide'], status: 'paid', dueDate: '2026-10-10', paidAt: '2026-10-02' },
  { number: 'INV-002', project: 'E-commerce website', milestones: ['Design mockups'], status: 'paid', dueDate: '2026-10-25', paidAt: '2026-10-12' },
  { number: 'INV-003', project: 'Mobile app landing page', milestones: ['Landing page design'], status: 'unpaid', dueDate: '2026-12-05' }
]

// chat, from is an email
const chats = {
  'E-commerce website': [
    { from: 'hamza@acme.com', text: 'How is the product page coming along?' },
    { from: 'sara@sprintly.dev', text: 'Almost done, I will share a preview tomorrow.' }
  ],
  'Mobile app landing page': [
    { from: 'ayesha@fitapp.io', text: 'Can we add a pricing section?' },
    { from: 'sara@sprintly.dev', text: 'Sure, I will add it to the final build.' }
  ]
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)

  const password = await bcrypt.hash('123456', 10)

  for (let u of users) {
    const exists = await User.findOne({ email: u.email })
    if (exists) {
      console.log('already there: ' + u.email)
    } else {
      await User.create({ ...u, password })
      console.log('added: ' + u.email)
    }
  }

  for (let p of projects) {
    let project = await Project.findOne({ title: p.title })
    if (project) {
      console.log('already there: ' + p.title)
    } else {

    const freelancer = await User.findOne({ email: p.freelancer })
    const client = await User.findOne({ email: p.client })

    project = await Project.create({
      title: p.title,
      description: p.description,
      freelancer: freelancer._id,
      client: client._id,
      budget: p.budget,
      deadline: p.deadline,
      status: p.status,
      completedAt: p.completedAt
    })
    await Proposal.create({ ...p.proposal, project: project._id })
    console.log('added: ' + p.title)
    }

    // milestones + tasks, only if the project has none yet
    const hasMilestones = await Milestone.findOne({ project: project._id })
    if (hasMilestones || !milestones[p.title]) continue

    const made = {}
    for (let m of milestones[p.title]) {
      const ms = await Milestone.create({ ...m, project: project._id })
      made[m.title] = ms._id
    }
    let order = 0
    for (let t of tasks[p.title] || []) {
      await Task.create({ ...t, milestone: made[t.milestone], project: project._id, order: order++ })
    }
    console.log('added milestones and tasks: ' + p.title)
  }

  for (let r of reviews) {
    const project = await Project.findOne({ title: r.project })
    const from = await User.findOne({ email: r.from })
    const to = await User.findOne({ email: r.to })

    const exists = await Review.findOne({ project: project._id, from: from._id })
    if (exists) {
      console.log('already there: review from ' + r.from)
      continue
    }
    await Review.create({ project: project._id, from: from._id, to: to._id, rating: r.rating, comment: r.comment })
    // just one review each so the average is the rating
    to.ratingAvg = r.rating
    await to.save()
    console.log('added: review from ' + r.from)
  }

  // time entries
  for (let title in time) {
    const project = await Project.findOne({ title })
    if (await TimeEntry.findOne({ project: project._id })) {
      console.log('already there: time on ' + title)
      continue
    }
    for (let t of time[title]) {
      await TimeEntry.create({ ...t, user: project.freelancer, project: project._id })
    }
    console.log('added: time on ' + title)
  }

  // invoices
  for (let inv of invoices) {
    if (await Invoice.findOne({ number: inv.number })) {
      console.log('already there: ' + inv.number)
      continue
    }
    const project = await Project.findOne({ title: inv.project })
    const items = []
    for (let mTitle of inv.milestones) {
      const m = await Milestone.findOne({ project: project._id, title: mTitle })
      items.push({ description: 'Milestone: ' + m.title, qty: 1, rate: m.amount, amount: m.amount, milestone: m._id })
    }
    let total = 0
    for (let i of items) total += i.amount
    await Invoice.create({
      number: inv.number,
      project: project._id,
      freelancer: project.freelancer,
      client: project.client,
      items,
      total,
      status: inv.status,
      dueDate: inv.dueDate,
      paidAt: inv.paidAt
    })
    console.log('added: ' + inv.number)
  }

  // chat messages
  for (let title in chats) {
    const project = await Project.findOne({ title })
    if (await Message.findOne({ project: project._id })) {
      console.log('already there: chat on ' + title)
      continue
    }
    for (let c of chats[title]) {
      const from = await User.findOne({ email: c.from })
      await Message.create({ project: project._id, sender: from._id, text: c.text })
    }
    console.log('added: chat on ' + title)
  }

  mongoose.disconnect()
}

seed()
