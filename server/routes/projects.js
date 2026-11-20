const express = require('express')
const Project = require('../models/Project')
const User = require('../models/User')
const auth = require('../middleware/auth')
const notify = require('../utils/notify')

const router = express.Router()

// get my projects (freelancer or client)
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ freelancer: req.user._id }, { client: req.user._id }]
    })
      .populate('freelancer', 'name email')
      .populate('client', 'name email')
      .sort({ createdAt: -1 })

    res.json(projects)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// get one project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('freelancer', 'name email')
      .populate('client', 'name email')

    if (!project) {
      return res.status(404).json({ message: 'project not found' })
    }

    const myId = req.user._id.toString()
    if (project.freelancer._id.toString() !== myId && project.client._id.toString() !== myId) {
      return res.status(403).json({ message: 'not your project' })
    }

    res.json(project)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// create project (freelancer only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'only freelancers can create projects' })
    }

    const { title, description, budget, deadline, clientEmail } = req.body

    if (!title || !clientEmail) {
      return res.status(400).json({ message: 'title and client email are required' })
    }

    // find the client by email
    const client = await User.findOne({ email: clientEmail, role: 'client' })
    if (!client) {
      return res.status(400).json({ message: 'no client found with this email' })
    }

    const project = new Project({
      title,
      description,
      budget,
      deadline,
      freelancer: req.user._id,
      client: client._id
    })
    await project.save()

    await notify(client._id, req.user.name + ' added you to the project ' + project.title, '/projects/' + project._id)

    res.json(project)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// edit project (only the freelancer who made it)
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'project not found' })
    }
    if (project.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'only the freelancer can edit this' })
    }

    const { title, description, budget, deadline } = req.body
    if (title) project.title = title
    if (description !== undefined) project.description = description
    if (budget !== undefined) project.budget = budget
    if (deadline) project.deadline = deadline

    await project.save()
    res.json(project)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// mark as complete
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'project not found' })
    }
    if (project.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'only the freelancer can complete this' })
    }
    if (project.status !== 'active') {
      return res.status(400).json({ message: 'only active projects can be completed' })
    }

    project.status = 'completed'
    project.completedAt = new Date()
    await project.save()

    await notify(project.client, req.user.name + ' marked ' + project.title + ' as complete. Leave a review!', '/projects/' + project._id + '/review')

    res.json(project)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

module.exports = router
