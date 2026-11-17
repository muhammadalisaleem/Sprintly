const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const auth = require('../middleware/auth')

const router = express.Router()

// register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'please fill all fields' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'password should be atleast 6 characters' })
    }

    let user = await User.findOne({ email })
    if (user) {
      return res.status(400).json({ message: 'email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    user = new User({ name, email, password: hashedPassword, role })
    await user.save()

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    user.password = undefined
    res.json({ token, user })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'please enter email and password' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'invalid email or password' })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    user.password = undefined
    res.json({ token, user })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// get logged in user
router.get('/me', auth, (req, res) => {
  res.json(req.user)
})

module.exports = router
