const express = require('express')
const auth = require('../middleware/auth')
const TimeEntry = require('../models/TimeEntry')
const Task = require('../models/Task')
const { isValidId, getMemberProject } = require('../utils/access')
const { toDay } = require('../utils/dates')

const router = express.Router()

// time entries of one project + total hours (both members can see them)
router.get('/projects/:id/time', auth, async (req, res) => {
  try {
    const project = await getMemberProject(req.params.id, req.user)
    if (!project) return res.status(404).json({ message: 'project not found' })

    const entries = await TimeEntry.find({ project: project._id })
      .populate('user', 'name')
      .populate('task', 'title')
      .sort({ date: -1, createdAt: -1 })

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
    res.json({ entries, totalHours: Math.round(totalHours * 100) / 100 })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// add time, from the timer or the manual form (only the project's freelancer)
router.post('/projects/:id/time', auth, async (req, res) => {
  try {
    const project = await getMemberProject(req.params.id, req.user)
    if (!project) return res.status(404).json({ message: 'project not found' })
    if (!project.freelancer.equals(req.user._id)) {
      return res.status(403).json({ message: 'only the freelancer can log time' })
    }
    if (project.status !== 'active') {
      return res.status(400).json({ message: 'time can only be logged on active projects' })
    }

    const { hours, date, note, task } = req.body
    const h = Number(hours)
    if (!h || h <= 0 || h > 24) {
      return res.status(400).json({ message: 'hours should be between 0 and 24' })
    }

    const day = toDay(date)
    if (!day) {
      return res.status(400).json({ message: 'invalid date' })
    }

    if (task) {
      const taskOk = isValidId(task) && await Task.exists({ _id: task, project: project._id })
      if (!taskOk) return res.status(400).json({ message: 'task is not part of this project' })
    }

    const entry = await TimeEntry.create({
      user: req.user._id,
      project: project._id,
      task: task || undefined,
      hours: Math.max(0.01, Math.round(h * 100) / 100),
      date: day,
      note: typeof note === 'string' ? note.trim() : ''
    })
    res.status(201).json(entry)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// all my time entries, for the timesheet page
router.get('/time', auth, async (req, res) => {
  try {
    const entries = await TimeEntry.find({ user: req.user._id })
      .populate('project', 'title')
      .sort({ date: -1, createdAt: -1 })
    res.json(entries)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// delete my own entry, as long as it is not on an invoice yet
router.delete('/time/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'entry not found' })

    const entry = await TimeEntry.findById(req.params.id)
    if (!entry || !entry.user.equals(req.user._id)) {
      return res.status(404).json({ message: 'entry not found' })
    }
    if (entry.invoiced) {
      return res.status(400).json({ message: 'this time is already on an invoice' })
    }

    await entry.deleteOne()
    res.json({ message: 'entry deleted' })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

module.exports = router
