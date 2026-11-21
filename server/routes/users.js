const express = require('express')
const User = require('../models/User')
const Project = require('../models/Project')
const Review = require('../models/Review')
const auth = require('../middleware/auth')
const { isValidId } = require('../utils/access')

const router = express.Router()

// edit my profile
// (this has to be above /:id or "me" gets read as an id)
router.put('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const { name, bio, skills, hourlyRate } = req.body

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ message: 'name is required' })
    }
    if (hourlyRate !== undefined && (isNaN(Number(hourlyRate)) || Number(hourlyRate) < 0)) {
      return res.status(400).json({ message: 'hourly rate cant be negative' })
    }

    if (name) user.name = name.trim()
    if (bio !== undefined) user.bio = bio
    // skills and rate are only for freelancers
    if (user.role === 'freelancer') {
      if (Array.isArray(skills)) user.skills = skills
      if (hourlyRate !== undefined) user.hourlyRate = Number(hourlyRate)
    }

    await user.save()
    user.password = undefined
    res.json(user)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// public profile: the person, reviews they got and how many projects they finished
router.get('/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'user not found' })
    }

    const user = await User.findById(req.params.id).select('-password -email')
    if (!user) {
      return res.status(404).json({ message: 'user not found' })
    }

    const reviews = await Review.find({ to: user._id })
      .populate('from', 'name')
      .populate('project', 'title')
      .sort({ createdAt: -1 })

    const completedProjects = await Project.countDocuments({
      status: 'completed',
      $or: [{ freelancer: user._id }, { client: user._id }]
    })

    res.json({ user, reviews, completedProjects })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

module.exports = router
