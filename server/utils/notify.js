const Notification = require('../models/Notification')
const { emitToUser } = require('../socket')

// Saves a notification and pushes it live to that user (event notification:new).
// Use it in any route, for example:
//   await notify(project.client, `${req.user.name} sent you a proposal`, `/proposals/${proposal._id}`)
// It never throws, so a failed notification can't break the request that sent it.
async function notify(userId, text, link = '') {
  try {
    const notification = await Notification.create({ user: userId, text, link })
    emitToUser(userId, 'notification:new', notification)
    return notification
  } catch (err) {
    console.log('notify failed', err)
    return null
  }
}

module.exports = notify
