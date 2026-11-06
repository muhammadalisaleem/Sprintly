import { useNavigate } from 'react-router-dom'
import { FiBell, FiCheck } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import { getCurrentUser } from '../../mockData'
import { useNotifications, markRead, markAllRead } from '../../utils/notifications'
import { formatDate, formatTime } from '../../utils/format'
import './notifications.css'

function NotificationsPage() {
  const user = getCurrentUser()
  const navigate = useNavigate()
  const { notifications, unreadCount } = useNotifications(user._id)

  function open(n) {
    markRead(n._id)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Notifications</h2>
          <p className="muted">{unreadCount} unread</p>
        </div>
        <Button variant="secondary" onClick={() => markAllRead(user._id)} disabled={unreadCount === 0}>
          <FiCheck /> Mark all read
        </Button>
      </div>

      <Card className="notification-card">
        {notifications.length === 0 ? (
          <EmptyState icon={<FiBell />} title="No notifications" message="Updates about your projects show up here." />
        ) : (
          notifications.map((n) => (
            <div key={n._id} className={`notification ${n.read ? '' : 'unread'}`}>
              <span className="notification-dot" />
              <button className="notification-text" onClick={() => open(n)}>
                <span>{n.text}</span>
                <span className="muted">{formatDate(n.createdAt)} · {formatTime(n.createdAt)}</span>
              </button>
              {!n.read && (
                <Button variant="ghost" size="sm" onClick={() => markRead(n._id)}>Mark read</Button>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  )
}

export default NotificationsPage
