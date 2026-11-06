import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { FiDollarSign, FiAlertCircle, FiBriefcase, FiClock } from 'react-icons/fi'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import StatCard from './StatCard'
import { milestones, timeEntries, getUserProjects } from '../../mockData'
import { formatDate, formatHours, formatMoney, isPast, toInputDate } from '../../utils/format'
import { getUserInvoices, invoiceStatus } from '../invoices/invoiceUtils'
import './dashboard.css'

// paid totals for the last 6 months, oldest first
function revenueByMonth(paidInvoices) {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      revenue: 0,
    })
  }
  paidInvoices.forEach((inv) => {
    const d = new Date(inv.paidAt)
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (m) m.revenue += inv.total
  })
  return months
}

function mondayThisWeek() {
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toInputDate(d)
}

function FreelancerDashboard({ user }) {
  const myProjects = getUserProjects(user._id)
  const activeProjects = myProjects.filter((p) => p.status === 'active')
  const myInvoices = getUserInvoices(user).map((inv) => ({ ...inv, status: invoiceStatus(inv) }))

  const paid = myInvoices.filter((inv) => inv.status === 'paid')
  const totalEarned = paid.reduce((sum, inv) => sum + inv.total, 0)
  const unpaidTotal = myInvoices.filter((inv) => inv.status !== 'paid').reduce((sum, inv) => sum + inv.total, 0)

  const monday = mondayThisWeek()
  const hoursThisWeek = timeEntries
    .filter((e) => e.user === user._id && e.date >= monday)
    .reduce((sum, e) => sum + e.hours, 0)

  // open milestones and project deadlines, soonest first
  const activeIds = activeProjects.map((p) => p._id)
  const deadlines = [
    ...milestones
      .filter((m) => activeIds.includes(m.project) && !m.completed)
      .map((m) => ({
        id: m._id,
        title: m.title,
        project: activeProjects.find((p) => p._id === m.project),
        date: m.dueDate,
        link: `/projects/${m.project}/milestones`,
      })),
    ...activeProjects.map((p) => ({
      id: p._id,
      title: 'Project deadline',
      project: p,
      date: p.deadline,
      link: `/projects/${p._id}`,
    })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const chartData = revenueByMonth(paid)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Welcome back, {user.name.split(' ')[0]}</h2>
          <p className="muted">Here's how your work is going.</p>
        </div>
      </div>

      <div className="stats">
        <StatCard icon={<FiDollarSign />} label="Total earned" value={formatMoney(totalEarned)} colour="green" />
        <StatCard icon={<FiAlertCircle />} label="Unpaid" value={formatMoney(unpaidTotal)} colour="yellow" />
        <StatCard icon={<FiBriefcase />} label="Active projects" value={activeProjects.length} colour="blue" />
        <StatCard icon={<FiClock />} label="Hours this week" value={formatHours(hoursThisWeek)} colour="purple" />
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
              {deadlines.map((d) => (
                <li key={d.id}>
                  <div>
                    <Link to={d.link}><strong>{d.title}</strong></Link>
                    <div className="muted">{d.project?.title}</div>
                  </div>
                  <span className={isPast(d.date) ? 'overdue' : 'muted'}>
                    {isPast(d.date) ? 'Overdue · ' : ''}{formatDate(d.date)}
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
