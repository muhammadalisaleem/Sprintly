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

  mongoose.disconnect()
}

seed()
