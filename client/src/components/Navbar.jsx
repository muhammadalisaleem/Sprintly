import { Link } from 'react-router-dom'
import { FiMenu, FiBell, FiLogOut, FiZap } from 'react-icons/fi'
import { useNotifications } from '../utils/notifications'

function Navbar({ user, onMenuClick }) {
  const { unreadCount } = useNotifications(user._id)

  // first letters of the name, e.g. "Sara Khan" -> "SK"
  const initials = user.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)

  return (
    <header className="navbar no-print">
      <div className="row">
        <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <FiMenu size={22} />
        </button>
        <Link to="/dashboard" className="logo">
          <FiZap /> Sprintly
        </Link>
      </div>

      <div className="row">
        <Link to="/notifications" className="bell" aria-label="Notifications">
          <FiBell size={20} />
          {unreadCount > 0 && <span className="bell-count">{unreadCount}</span>}
        </Link>

        <Link to="/profile" className="user-chip">
          <span className="avatar">{initials}</span>
          <span className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </span>
        </Link>

        <Link to="/login" className="btn btn-ghost btn-sm" aria-label="Log out">
          <FiLogOut size={18} />
        </Link>
      </div>
    </header>
  )
}

export default Navbar
