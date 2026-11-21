const express = require('express')
const Task = require('../models/Task')
const Milestone = require('../models/Milestone')
const auth = require('../middleware/auth')
const { isValidId, getMemberProject } = require('../utils/access')

const router = express.Router()

const statuses = ['todo', 'doing', 'done']
const priorities = ['low', 'medium', 'high']

// tasks of a project, in board order
router.get('/projects/:id/tasks', auth, async (req, res) => {
  try {
    const project = await getMemberProject(req.params.id, req.user)
    if (!project) return res.status(404).json({ message: 'project not found' })

    const tasks = await Task.find({ project: project._id }).sort({ order: 1, createdAt: 1 })
    res.json(tasks)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// add a task (freelancer only)
router.post('/projects/:id/tasks', auth, async (req, res) => {
  try {
    const project = await getMemberProject(req.params.id, req.user)
    if (!project) return res.status(404).json({ message: 'project not found' })
    if (!project.freelancer.equals(req.user._id)) {
      return res.status(403).json({ message: 'only the freelancer can add tasks' })
    }

    const { title, description, status, priority, dueDate, milestone } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'title is required' })
    }
    if (status && !statuses.includes(status)) return res.status(400).json({ message: 'wrong status' })
    if (priority && !priorities.includes(priority)) return res.status(400).json({ message: 'wrong priority' })

    if (milestone) {
      const ok = isValidId(milestone) && await Milestone.exists({ _id: milestone, project: project._id })
      if (!ok) return res.status(400).json({ message: 'milestone is not part of this project' })
    }

    // put it at the bottom of its column
    const last = await Task.findOne({ project: project._id, status: status || 'todo' }).sort({ order: -1 })

    const task = new Task({
      project: project._id,
      title: title.trim(),
      description,
      status,
      priority,
      dueDate: dueDate || undefined,
      milestone: milestone || undefined,
      order: last ? last.order + 1 : 0
    })
    await task.save()
    res.json(task)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// finds the task and checks that im the freelancer of its project
async function getMyTask(req, res) {
  if (!isValidId(req.params.id)) {
    res.status(404).json({ message: 'task not found' })
    return null
  }
  const task = await Task.findById(req.params.id)
  const project = task ? await getMemberProject(task.project, req.user) : null
  if (!task || !project) {
    res.status(404).json({ message: 'task not found' })
    return null
  }
  if (!project.freelancer.equals(req.user._id)) {
    res.status(403).json({ message: 'only the freelancer can change tasks' })
    return null
  }
  return task
}

// edit a task
router.put('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await getMyTask(req, res)
    if (!task) return

    const { title, description, status, priority, dueDate, milestone } = req.body
    if (title !== undefined && !title.trim()) return res.status(400).json({ message: 'title is required' })
    if (status && !statuses.includes(status)) return res.status(400).json({ message: 'wrong status' })
    if (priority && !priorities.includes(priority)) return res.status(400).json({ message: 'wrong priority' })

    if (milestone) {
      const ok = isValidId(milestone) && await Milestone.exists({ _id: milestone, project: task.project })
      if (!ok) return res.status(400).json({ message: 'milestone is not part of this project' })
    }

    if (title) task.title = title.trim()
    if (description !== undefined) task.description = description
    if (priority) task.priority = priority
    if (dueDate !== undefined) task.dueDate = dueDate || undefined
    if (milestone !== undefined) task.milestone = milestone || undefined

    // changed column from the modal, so send it to the bottom of the new one
    if (status && status !== task.status) {
      const last = await Task.findOne({ project: task.project, status }).sort({ order: -1 })
      task.status = status
      task.order = last ? last.order + 1 : 0
    }

    await task.save()
    res.json(task)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// drag and drop: move to a column and a position in it
// body: { status, index }
router.patch('/tasks/:id/move', auth, async (req, res) => {
  try {
    const task = await getMyTask(req, res)
    if (!task) return

    const { status } = req.body
    let index = Number(req.body.index) || 0
    if (!statuses.includes(status)) return res.status(400).json({ message: 'wrong status' })

    // the other tasks in that column, then put this one in at the index
    const column = await Task.find({ project: task.project, status, _id: { $ne: task._id } }).sort({ order: 1, createdAt: 1 })
    if (index < 0) index = 0
    if (index > column.length) index = column.length
    column.splice(index, 0, task)

    task.status = status
    // number them again 0,1,2...
    for (let i = 0; i < column.length; i++) {
      column[i].order = i
      await column[i].save()
    }

    res.json(task)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await getMyTask(req, res)
    if (!task) return

    await task.deleteOne()
    res.json({ message: 'task deleted' })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

module.exports = router
