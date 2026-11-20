const express = require('express')
const auth = require('../middleware/auth')
const Message = require('../models/Message')
const { getMemberProject } = require('../utils/access')
const { emitToProject } = require('../socket')
const notify = require('../utils/notify')

const router = express.Router()

// only links to files uploaded through POST /api/upload
// (stops links like javascript:... being saved and clicked later)
function isUploadUrl(url) {
  return /^(https?:\/\/[^\s/]+)?\/uploads\/[\w.-]+$/.test(url)
}

// chat history of a project, oldest first
router.get('/projects/:id/messages', auth, async (req, res) => {
  try {
    const project = await getMemberProject(req.params.id, req.user)
    if (!project) return res.status(404).json({ message: 'project not found' })

    const messages = await Message.find({ project: project._id })
      .populate('sender', 'name')
      .sort({ createdAt: 1 })
    res.json(messages)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// send a message (text, a file, or both)
// everyone with the chat open gets it live (message:new), the other side also gets a notification
router.post('/projects/:id/messages', auth, async (req, res) => {
  try {
    const project = await getMemberProject(req.params.id, req.user)
    if (!project) return res.status(404).json({ message: 'project not found' })

    const text = typeof req.body.text === 'string' ? req.body.text.trim() : ''
    const fileUrl = typeof req.body.fileUrl === 'string' ? req.body.fileUrl.trim() : ''
    const fileName = typeof req.body.fileName === 'string' ? req.body.fileName.trim().slice(0, 200) : ''

    if (!text && !fileUrl) {
      return res.status(400).json({ message: 'message is empty' })
    }
    if (text.length > 2000) {
      return res.status(400).json({ message: 'message is too long (2000 characters max)' })
    }
    if (fileUrl && !isUploadUrl(fileUrl)) {
      return res.status(400).json({ message: 'invalid file link, upload the file first' })
    }

    const message = await Message.create({
      project: project._id,
      sender: req.user._id,
      text,
      fileUrl,
      fileName: fileUrl ? fileName || 'file' : ''
    })
    await message.populate('sender', 'name')

    emitToProject(project._id, 'message:new', message)
    const other = project.freelancer.equals(req.user._id) ? project.client : project.freelancer
    await notify(other, `${req.user.name} sent a new message on ${project.title}`, `/chat?project=${project._id}`)

    res.status(201).json(message)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

module.exports = router
