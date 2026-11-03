import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { getCurrentUser } from '../mockData'
import './layout.css'

// navbar on top, sidebar on the left, the current page on the right
function DashboardLayout() {
  const user = getCurrentUser()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="layout">
      <Navbar user={user} onMenuClick={() => setMenuOpen(!menuOpen)} />

      <div className="layout-body">
        <Sidebar role={user.role} open={menuOpen} onClose={() => setMenuOpen(false)} />

        {/* dark background behind the sidebar on mobile */}
        {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
