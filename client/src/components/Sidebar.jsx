import { NavLink } from 'react-router-dom'
import {
  FiHome,
  FiFolder,
  FiClock,
  FiCalendar,
  FiFileText,
  FiMessageSquare,
  FiBell,
  FiUser,
} from 'react-icons/fi'

const freelancerLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
  { to: '/projects', label: 'Projects', icon: <FiFolder /> },
  { to: '/time', label: 'Time Tracker', icon: <FiClock /> },
  { to: '/timesheet', label: 'Timesheet', icon: <FiCalendar /> },
  { to: '/invoices', label: 'Invoices', icon: <FiFileText /> },
  { to: '/chat', label: 'Messages', icon: <FiMessageSquare /> },
  { to: '/notifications', label: 'Notifications', icon: <FiBell /> },
  { to: '/profile', label: 'Profile', icon: <FiUser /> },
]

// clients don't track time, so no time links
const clientLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
  { to: '/projects', label: 'My Projects', icon: <FiFolder /> },
  { to: '/invoices', label: 'Invoices', icon: <FiFileText /> },
  { to: '/chat', label: 'Messages', icon: <FiMessageSquare /> },
  { to: '/notifications', label: 'Notifications', icon: <FiBell /> },
  { to: '/profile', label: 'Profile', icon: <FiUser /> },
]

function Sidebar({ role, open, onClose }) {
  const links = role === 'client' ? clientLinks : freelancerLinks

  return (
    <aside className={open ? 'sidebar open no-print' : 'sidebar no-print'}>
      <nav>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
            onClick={onClose}
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
