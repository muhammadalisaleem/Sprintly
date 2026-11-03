import { Link } from 'react-router-dom'
import { FiClock } from 'react-icons/fi'
import Card from '../../components/Card'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { timeEntries, getCurrentUser, getProject } from '../../mockData'
import { formatDate, formatHours, toInputDate } from '../../utils/format'
import './time.css'

// monday of the week the date is in, as 'yyyy-mm-dd'
function weekStart(dateString) {
  const d = new Date(dateString + 'T00:00:00')
  const day = (d.getDay() + 6) % 7 // monday = 0
  d.setDate(d.getDate() - day)
  return toInputDate(d)
}

function weekLabel(start) {
  const end = new Date(start + 'T00:00:00')
  end.setDate(end.getDate() + 6)
  return `${formatDate(start)} – ${formatDate(end)}`
}

function Timesheet() {
  const user = getCurrentUser()
  const myEntries = timeEntries.filter((e) => e.user === user._id)

  // { '2026-10-19': [entries], ... }
  const weeks = {}
  myEntries.forEach((e) => {
    const key = weekStart(e.date)
    if (!weeks[key]) weeks[key] = []
    weeks[key].push(e)
  })
  const weekKeys = Object.keys(weeks).sort().reverse()
  const grandTotal = myEntries.reduce((sum, e) => sum + e.hours, 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Timesheet</h2>
          <p className="muted">All your logged time, grouped by week · {formatHours(grandTotal)} total</p>
        </div>
        <Link to="/time"><Button>Track time</Button></Link>
      </div>

      {weekKeys.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FiClock />}
            title="No time logged yet"
            message="Entries from the time tracker show up here."
            action={<Link to="/time"><Button>Open time tracker</Button></Link>}
          />
        </Card>
      ) : (
        weekKeys.map((key) => {
          const entries = weeks[key].sort((a, b) => a.date.localeCompare(b.date))
          const total = entries.reduce((sum, e) => sum + e.hours, 0)
          return (
            <Card key={key} className="week-block">
              <div className="week-header">
                <h3>{weekLabel(key)}</h3>
                <span className="week-total">{formatHours(total)}</span>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Project</th>
                      <th>Note</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e._id}>
                        <td>{formatDate(e.date)}</td>
                        <td>
                          <Link to={`/projects/${e.project}`}>{getProject(e.project)?.title}</Link>
                        </td>
                        <td>{e.note}</td>
                        <td>{formatHours(e.hours)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        })
      )}
    </div>
  )
}

export default Timesheet
