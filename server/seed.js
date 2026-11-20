// adds the demo users, projects and proposals to the database
// run with: node seed.js
// all of them have password 123456
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()
const User = require('./models/User')
const Project = require('./models/Project')
const Proposal = require('./models/Proposal')

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
    const exists = await Project.findOne({ title: p.title })
    if (exists) {
      console.log('already there: ' + p.title)
      continue
    }

    const freelancer = await User.findOne({ email: p.freelancer })
    const client = await User.findOne({ email: p.client })

    const project = await Project.create({
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

  mongoose.disconnect()
}

seed()
