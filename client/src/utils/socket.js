import { io } from 'socket.io-client'
import { SERVER_URL } from '../api'

// one socket for the whole app (chat + live notifications)
let socket = null
let socketToken = null

// connects with the login token, makes a new one if the user changed
export function getSocket() {
  const token = localStorage.getItem('token')
  if (!token) return null

  if (socket && socketToken === token) return socket

  if (socket) socket.disconnect()
  socket = io(SERVER_URL, { auth: { token } })
  socketToken = token
  return socket
}

// on logout
export function closeSocket() {
  if (socket) socket.disconnect()
  socket = null
  socketToken = null
}
