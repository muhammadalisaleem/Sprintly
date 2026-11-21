import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBriefcase, FiFileText, FiAlertCircle } from 'react-icons/fi'
import Card from '../../components/Card'
import Button from '../../components/Button'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import StatCard from './StatCard'
import Loader from '../../components/Loader'
import api from '../../api'
import { formatDate, formatMoney } from '../../utils/format'
import './dashboard.css'

function ClientDashboard({ user }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/dashboard/client')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'could not load dashboard'))
  }, [])

  if (error) return <div className="page"><p className="form-error">{error}</p></div>
  if (!data) return <Loader />

  // server already worked out progress, pending proposals and unpaid invoices
  const myProjects = data.projects
  const pendingProposals = data.pendingProposals
  const unpaidInvoices = data.unpaidInvoices
  const unpaidTotal = data.unpaidTotal

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Welcome back, {user.name.split(' ')[0]}</h2>
          <p className="muted">Your projects at a glance.</p>
        </div>
      </div>

      <div className="stats stats-3">
        <StatCard
          icon={<FiBriefcase />}
          label="Active projects"
          value={data.activeProjects}
          colour="blue"
        />
        <StatCard icon={<FiFileText />} label="Pending proposals" value={pendingProposals.length} colour="purple" />
        <StatCard icon={<FiAlertCircle />} label="Unpaid invoices" value={formatMoney(unpaidTotal)} colour="yellow" />
      </div>

      <Card title="My projects" className="dash-section">
        {myProjects.length === 0 ? (
          <EmptyState title="No projects yet" message="A freelancer will add you to a project by your email." />
        ) : (
          <ul className="dash-list">
            {myProjects.map((p) => {
              const pct = p.progress
              return (
                <li key={p._id}>
                  <div className="project-progress">
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <Link to={`/projects/${p._id}`}><strong>{p.title}</strong></Link>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="muted">
                      {p.freelancer?.name} · due {formatDate(p.deadline)} · {pct}% done
                    </div>
                    <div className="progress"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <div className="dash-grid dash-grid-even" style={{ marginTop: 16 }}>
        <Card title="Pending proposals">
          {pendingProposals.length === 0 ? (
            <EmptyState title="No pending proposals" />
          ) : (
            <ul className="dash-list">
              {pendingProposals.map((pr) => (
                <li key={pr._id}>
                  <div>
                    <strong>{pr.project?.title}</strong>
                    <div className="muted">{formatMoney(pr.amount)} · {pr.timeline}</div>
                  </div>
                  <Link to={`/proposals/${pr._id}`}><Button size="sm">Review</Button></Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Unpaid invoices">
          {unpaidInvoices.length === 0 ? (
            <EmptyState title="All paid up" message="You have no unpaid invoices." />
          ) : (
            <ul className="dash-list">
              {unpaidInvoices.map((inv) => (
                <li key={inv._id}>
                  <div>
                    <Link to={`/invoices/${inv._id}`}><strong>{inv.number}</strong></Link>
                    <div className="muted">{inv.project?.title} · due {formatDate(inv.dueDate)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div><strong>{formatMoney(inv.total)}</strong></div>
                    <StatusBadge status={inv.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ClientDashboard
