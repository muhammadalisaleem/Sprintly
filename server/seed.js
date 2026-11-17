// adds the demo users to the database
// run with: node seed.js
// all of them have password 123456
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()
const User = require('./models/User')

const users = [
  { name: 'Sara Khan', email: 'sara@sprintly.dev', role: 'freelancer', bio: 'Full-stack developer who builds fast, clean web apps.', skills: ['React', 'Node.js', 'MongoDB'], hourlyRate: 40 },
  { name: 'Bilal Ahmed', email: 'bilal@sprintly.dev', role: 'freelancer', bio: 'Brand and UI designer.', skills: ['Figma', 'Branding', 'Illustration'], hourlyRate: 35 },
  { name: 'Hamza Malik', email: 'hamza@acme.com', role: 'client', bio: 'Owner of Acme Store.' },
  { name: 'Ayesha Raza', email: 'ayesha@fitapp.io', role: 'client', bio: 'Product manager at FitApp.' },
  { name: 'Usman Tariq', email: 'usman@spiceroute.pk', role: 'client', bio: 'Runs the Spice Route restaurant.' },
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

  mongoose.disconnect()
}

seed()
