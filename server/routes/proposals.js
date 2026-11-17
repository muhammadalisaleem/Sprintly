const express = require('express')
const Proposal = require('../models/Proposal')
const Project = require('../models/Project')
const auth = require('../middleware/auth')

const router = express.Router()

// get all proposals of a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
    if (!project) {
      return res.status(404).json({ message: 'project not found' })
    }

    const myId = req.user._id.toString()
    if (project.freelancer.toString() !== myId && project.client.toString() !== myId) {
      return res.status(403).json({ message: 'not your project' })
    }

    const proposals = await Proposal.find({ project: project._id }).sort({ createdAt: -1 })
    res.json(proposals)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// get one proposal with its project and both people
router.get('/:id', auth, async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate({
      path: 'project',
      populate: [
        { path: 'freelancer', select: 'name email' },
        { path: 'client', select: 'name email' }
      ]
    })

    if (!proposal) {
      return res.status(404).json({ message: 'proposal not found' })
    }

    const myId = req.user._id.toString()
    if (proposal.project.freelancer._id.toString() !== myId && proposal.project.client._id.toString() !== myId) {
      return res.status(403).json({ message: 'not your proposal' })
    }

    res.json(proposal)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// send a proposal (freelancer of the project)
router.post('/', auth, async (req, res) => {
  try {
    const { project, scope, deliverables, amount, timeline } = req.body

    if (!project || !scope || !amount) {
      return res.status(400).json({ message: 'scope and amount are required' })
    }

    const p = await Project.findById(project)
    if (!p) {
      return res.status(404).json({ message: 'project not found' })
    }
    if (p.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'only the freelancer can send a proposal' })
    }

    // only one open or accepted proposal per project
    const already = await Proposal.findOne({ project, status: { $in: ['pending', 'accepted'] } })
    if (already) {
      return res.status(400).json({ message: 'this project already has a proposal' })
    }

    const proposal = new Proposal({ project, scope, deliverables, amount, timeline })
    await proposal.save()

    // todo: notify(p.client, ...)

    res.json(proposal)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// client accepts, project becomes active
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
    if (!proposal) {
      return res.status(404).json({ message: 'proposal not found' })
    }

    const project = await Project.findById(proposal.project)
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'only the client can accept' })
    }
    if (proposal.status !== 'pending') {
      return res.status(400).json({ message: 'proposal is already ' + proposal.status })
    }

    proposal.status = 'accepted'
    await proposal.save()

    project.status = 'active'
    project.budget = proposal.amount
    await project.save()

    // todo: notify(project.freelancer, ...)

    res.json(proposal)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// client rejects
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
    if (!proposal) {
      return res.status(404).json({ message: 'proposal not found' })
    }

    const project = await Project.findById(proposal.project)
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'only the client can reject' })
    }
    if (proposal.status !== 'pending') {
      return res.status(400).json({ message: 'proposal is already ' + proposal.status })
    }

    proposal.status = 'rejected'
    await proposal.save()

    // todo: notify(project.freelancer, ...)

    res.json(proposal)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

module.exports = router
