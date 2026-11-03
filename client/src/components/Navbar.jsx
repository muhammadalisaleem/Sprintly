import { Link, useNavigate } from 'react-router-dom'
import { FiMenu, FiBell, FiLogOut, FiZap } from 'react-icons/fi'
import { useNotifications } from '../utils/notifications'
import { useAuth } from '../context/AuthContext'

function Navbar({ user, onMenuClick }) {
  const { unreadCount } = useNotifications(user._id)
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

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

        <button className="btn btn-ghost btn-sm" onClick={handleLogout} aria-label="Log out">
          <FiLogOut size={18} />
        </button>
      </div>
    </header>
  )
}

export default Navbar
