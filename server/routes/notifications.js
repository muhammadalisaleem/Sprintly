const express = require('express')
const auth = require('../middleware/auth')
const Notification = require('../models/Notification')
const { isValidId } = require('../utils/access')

const router = express.Router()

// my latest 50 notifications + how many are unread (for the bell)
router.get('/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false })
    res.json({ notifications, unreadCount })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// this route must come before /:id/read so "read-all" is not taken as an id
router.patch('/notifications/read-all', auth, async (req, res) => {
  try {
    const result = await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
    res.json({ message: 'all marked as read', updated: result.modifiedCount })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

router.patch('/notifications/:id/read', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'notification not found' })

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { returnDocument: 'after' }
    )
    if (!notification) return res.status(404).json({ message: 'notification not found' })
    res.json(notification)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

module.exports = router
