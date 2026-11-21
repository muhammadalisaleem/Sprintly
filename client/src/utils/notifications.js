import { useEffect, useState } from 'react'
import api from '../api'
import { getSocket } from './socket'

// The navbar bell and NotificationsPage can be on screen together, so they
// share this one list. Every change fires this event and both re-read it.
const EVENT = 'notifications-changed'

let list = []
let listeningOn = null

function changed() {
  window.dispatchEvent(new Event(EVENT))
}

// get my notifications from the server
function load() {
  api.get('/notifications')
    .then((res) => {
      list = res.data.notifications
      changed()
    })
    .catch((err) => console.log(err))
}

// new ones come in live from socket.io
function listen() {
  const socket = getSocket()
  if (!socket || listeningOn === socket) return
  listeningOn = socket
  socket.on('notification:new', (n) => {
    if (list.some((item) => item._id === n._id)) return
    list = [n, ...list]
    changed()
  })
}

export async function markRead(id) {
  list = list.map((n) => (n._id === id ? { ...n, read: true } : n))
  changed()
  try {
    await api.patch('/notifications/' + id + '/read')
  } catch (err) {
    console.log(err)
  }
}

export async function markAllRead() {
  list = list.map((n) => ({ ...n, read: true }))
  changed()
  try {
    await api.patch('/notifications/read-all')
  } catch (err) {
    console.log(err)
  }
}

// on logout, so the next user doesnt see these
export function clearNotifications() {
  list = []
  listeningOn = null
  changed()
}

export function useNotifications(userId) {
  const [items, setItems] = useState(list)

  useEffect(() => {
    const update = () => setItems(list)
    window.addEventListener(EVENT, update)
    load()
    listen()
    return () => window.removeEventListener(EVENT, update)
  }, [userId])

  return { notifications: items, unreadCount: items.filter((n) => !n.read).length }
}
