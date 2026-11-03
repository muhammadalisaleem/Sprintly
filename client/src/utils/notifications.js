import { useEffect, useState } from 'react'
import { notifications, newId } from '../mockData'

// The bell and NotificationsPage can be on screen together, so every
// change fires this event and both re-read the list.
// Week 4: the API + socket 'notification:new' replace this.
const EVENT = 'notifications-changed'

function changed() {
  window.dispatchEvent(new Event(EVENT))
}

export function addNotification(userId, text, link) {
  notifications.unshift({
    _id: newId('n'),
    user: userId,
    text,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  })
  changed()
}

export function markRead(id) {
  const n = notifications.find((item) => item._id === id)
  if (n) n.read = true
  changed()
}

export function markAllRead(userId) {
  notifications.forEach((n) => {
    if (n.user === userId) n.read = true
  })
  changed()
}

function userNotifications(userId) {
  return notifications
    .filter((n) => n.user === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function useNotifications(userId) {
  const [list, setList] = useState(() => userNotifications(userId))

  useEffect(() => {
    const update = () => setList(userNotifications(userId))
    update()
    window.addEventListener(EVENT, update)
    return () => window.removeEventListener(EVENT, update)
  }, [userId])

  return { notifications: list, unreadCount: list.filter((n) => !n.read).length }
}
