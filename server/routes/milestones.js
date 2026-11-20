const express = require('express')
const Milestone = require('../models/Milestone')
const Task = require('../models/Task')
const Invoice = require('../models/Invoice')
const auth = require('../middleware/auth')
const { isValidId, getMemberProject } = require('../utils/access')
const notify = require('../utils/notify')

const router = express.Router()

// milestones of a project, soonest first
router.get('/projects/:id/milestones', auth, async (req, res) => {
  try {
    const project = await getMemberProject(req.params.id, req.user)
    if (!project) return res.status(404).json({ message: 'project not found' })

    const milestones = await Milestone.find({ project: project._id }).sort({ dueDate: 1 })
    res.json(milestones)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// add a milestone (freelancer only)
router.post('/projects/:id/milestones', auth, async (req, res) => {
  try {
    const project = await getMemberProject(req.params.id, req.user)
    if (!project) return res.status(404).json({ message: 'project not found' })
    if (!project.freelancer.equals(req.user._id)) {
      return res.status(403).json({ message: 'only the freelancer can add milestones' })
    }

    const { title, dueDate, amount } = req.body
    if (!title || !title.trim() || !dueDate) {
      return res.status(400).json({ message: 'title and due date are required' })
    }
    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) < 0)) {
      return res.status(400).json({ message: 'amount cant be negative' })
    }

    const milestone = new Milestone({
      project: project._id,
      title: title.trim(),
      dueDate,
      amount: Number(amount) || 0
    })
    await milestone.save()
    res.json(milestone)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// finds the milestone + its project, only for the freelancer
async function getMyMilestone(req, res) {
  if (!isValidId(req.params.id)) {
    res.status(404).json({ message: 'milestone not found' })
    return null
  }
  const milestone = await Milestone.findById(req.params.id)
  const project = milestone ? await getMemberProject(milestone.project, req.user) : null
  if (!milestone || !project) {
    res.status(404).json({ message: 'milestone not found' })
    return null
  }
  if (!project.freelancer.equals(req.user._id)) {
    res.status(403).json({ message: 'only the freelancer can change milestones' })
    return null
  }
  return { milestone, project }
}

// edit
router.put('/milestones/:id', auth, async (req, res) => {
  try {
    const found = await getMyMilestone(req, res)
    if (!found) return
    const milestone = found.milestone

    const { title, dueDate, amount } = req.body
    if (title !== undefined && !title.trim()) return res.status(400).json({ message: 'title is required' })
    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) < 0)) {
      return res.status(400).json({ message: 'amount cant be negative' })
    }

    if (title) milestone.title = title.trim()
    if (dueDate) milestone.dueDate = dueDate
    if (amount !== undefined) milestone.amount = Number(amount)

    await milestone.save()
    res.json(milestone)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// mark complete / undo (it flips)
router.patch('/milestones/:id/complete', auth, async (req, res) => {
  try {
    const found = await getMyMilestone(req, res)
    if (!found) return
    const { milestone, project } = found

    // once its billed it stays complete
    if (milestone.completed && await Invoice.exists({ 'items.milestone': milestone._id })) {
      return res.status(400).json({ message: 'this milestone is already on an invoice' })
    }

    milestone.completed = !milestone.completed
    await milestone.save()

    if (milestone.completed) {
      await notify(project.client, 'Milestone "' + milestone.title + '" was marked complete', '/projects/' + project._id + '?tab=milestones')
    }

    res.json(milestone)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

router.delete('/milestones/:id', auth, async (req, res) => {
  try {
    const found = await getMyMilestone(req, res)
    if (!found) return
    const milestone = found.milestone

    if (await Invoice.exists({ 'items.milestone': milestone._id })) {
      return res.status(400).json({ message: 'this milestone is already on an invoice' })
    }

    // tasks that were under it just have no milestone now
    await Task.updateMany({ milestone: milestone._id }, { $unset: { milestone: 1 } })
    await milestone.deleteOne()
    res.json({ message: 'milestone deleted' })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

module.exports = router
