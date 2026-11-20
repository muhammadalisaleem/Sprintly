const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { getMemberProject } = require('../utils/access')

let io = null

// room names
const userRoom = (id) => 'user:' + id
const projectRoom = (id) => 'project:' + id

function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } })

  // the client connects with io(url, { auth: { token } }), same token as the api
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('no token, please login'))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('-password')
      if (!user) return next(new Error('user not found'))
      socket.user = user
      next()
    } catch (err) {
      next(new Error('token is not valid'))
    }
  })

  io.on('connection', (socket) => {
    // every user gets a private room for their notifications
    socket.join(userRoom(socket.user._id))

    // open a project's chat: members only
    socket.on('join', async (projectId, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {}
      try {
        const project = await getMemberProject(projectId, socket.user)
        if (!project) return reply({ ok: false, message: 'project not found' })
        socket.join(projectRoom(project._id))
        reply({ ok: true })
      } catch (err) {
        console.log(err)
        reply({ ok: false, message: 'server error' })
      }
    })

    socket.on('leave', (projectId) => {
      socket.leave(projectRoom(projectId))
    })
  })

  return io
}

// send an event to everyone in a room (does nothing if sockets are not started)
function emitToProject(projectId, event, data) {
  if (io) io.to(projectRoom(projectId)).emit(event, data)
}

function emitToUser(userId, event, data) {
  if (io) io.to(userRoom(userId)).emit(event, data)
}

module.exports = { initSocket, emitToProject, emitToUser }
