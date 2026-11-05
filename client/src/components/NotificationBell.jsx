import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiBell } from 'react-icons/fi'
import { getCurrentUser } from '../mockData'
import { useNotifications, markRead, markAllRead } from '../utils/notifications'
import { formatDate } from '../utils/format'
import './NotificationBell.css'

// goes in the Navbar
function NotificationBell() {
  const user = getCurrentUser()
  const navigate = useNavigate()
  const { notifications, unreadCount } = useNotifications(user._id)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // close when clicking outside
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (!wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function openNotification(n) {
    markRead(n._id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="bell" ref={wrapRef}>
      <button
        className="bell-button"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <FiBell size={20} />
        {unreadCount > 0 && <span className="bell-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="bell-dropdown">
          <div className="bell-dropdown-header">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button className="bell-link" onClick={() => markAllRead(user._id)}>Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="muted bell-empty">You're all caught up.</p>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <button
                key={n._id}
                className={`bell-item ${n.read ? '' : 'unread'}`}
                onClick={() => openNotification(n)}
              >
                <span>{n.text}</span>
                <span className="muted">{formatDate(n.createdAt)}</span>
              </button>
            ))
          )}

          <Link to="/notifications" className="bell-footer" onClick={() => setOpen(false)}>
            View all
          </Link>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
