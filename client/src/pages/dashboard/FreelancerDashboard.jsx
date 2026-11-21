import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { FiDollarSign, FiAlertCircle, FiBriefcase, FiClock } from 'react-icons/fi'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import StatCard from './StatCard'
import Loader from '../../components/Loader'
import api from '../../api'
import { formatDate, formatHours, formatMoney } from '../../utils/format'
import './dashboard.css'

function FreelancerDashboard({ user }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  // all the numbers come from the server
  useEffect(() => {
    api.get('/dashboard/freelancer')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'could not load dashboard'))
  }, [])

  if (error) return <div className="page"><p className="form-error">{error}</p></div>
  if (!data) return <Loader />

  const deadlines = data.upcomingDeadlines
  const chartData = data.revenueByMonth

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Welcome back, {user.name.split(' ')[0]}</h2>
          <p className="muted">Here's how your work is going.</p>
        </div>
      </div>

      <div className="stats">
        <StatCard icon={<FiDollarSign />} label="Total earned" value={formatMoney(data.totalEarned)} colour="green" />
        <StatCard icon={<FiAlertCircle />} label="Unpaid" value={formatMoney(data.unpaidTotal)} colour="yellow" />
        <StatCard icon={<FiBriefcase />} label="Active projects" value={data.activeProjects} colour="blue" />
        <StatCard icon={<FiClock />} label="Hours this week" value={formatHours(data.hoursThisWeek)} colour="purple" />
      </div>

      <div className="dash-grid">
        <Card title="Revenue by month">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={56} />
                <Tooltip formatter={(v) => [formatMoney(v), 'Revenue']} cursor={{ fill: '#f5f6fa' }} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Upcoming deadlines">
          {deadlines.length === 0 ? (
            <EmptyState title="Nothing due" message="No open milestones on active projects." />
          ) : (
            <ul className="dash-list">
              {deadlines.map((d, i) => (
                <li key={i}>
                  <div>
                    <Link to={d.type === 'milestone' ? `/projects/${d.project._id}?tab=milestones` : `/projects/${d.project._id}`}>
                      <strong>{d.title}</strong>
                    </Link>
                    <div className="muted">{d.project?.title}</div>
                  </div>
                  <span className={d.overdue ? 'overdue' : 'muted'}>
                    {d.overdue ? 'Overdue · ' : ''}{formatDate(d.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

export default FreelancerDashboard
