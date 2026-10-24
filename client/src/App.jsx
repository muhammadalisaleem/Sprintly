import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import Profile from './pages/profile/Profile'
import PublicProfile from './pages/profile/PublicProfile'
import ProjectList from './pages/projects/ProjectList'
import ProjectForm from './pages/projects/ProjectForm'
import ProjectDetail from './pages/projects/ProjectDetail'
import ProposalForm from './pages/proposals/ProposalForm'
import ProposalView from './pages/proposals/ProposalView'
import KanbanBoard from './pages/tasks/KanbanBoard'
import MilestoneList from './pages/milestones/MilestoneList'
import TimeTracker from './pages/time/TimeTracker'
import Timesheet from './pages/time/Timesheet'
import InvoiceList from './pages/invoices/InvoiceList'
import InvoiceForm from './pages/invoices/InvoiceForm'
import InvoiceView from './pages/invoices/InvoiceView'
import ChatPage from './pages/chat/ChatPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import ReviewForm from './pages/reviews/ReviewForm'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />

      {/* auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<Dashboard />} />

      {/* profile */}
      <Route path="/profile" element={<Profile />} />
      <Route path="/users/:id" element={<PublicProfile />} />

      {/* projects */}
      <Route path="/projects" element={<ProjectList />} />
      <Route path="/projects/new" element={<ProjectForm />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="/projects/:id/tasks" element={<KanbanBoard />} />
      <Route path="/projects/:id/milestones" element={<MilestoneList />} />
      <Route path="/projects/:id/proposal/new" element={<ProposalForm />} />
      <Route path="/projects/:id/review" element={<ReviewForm />} />
      <Route path="/proposals/:id" element={<ProposalView />} />

      {/* time */}
      <Route path="/time" element={<TimeTracker />} />
      <Route path="/timesheet" element={<Timesheet />} />

      {/* invoices */}
      <Route path="/invoices" element={<InvoiceList />} />
      <Route path="/invoices/new" element={<InvoiceForm />} />
      <Route path="/invoices/:id" element={<InvoiceView />} />

      <Route path="/chat" element={<ChatPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
