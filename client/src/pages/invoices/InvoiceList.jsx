import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiFileText, FiPlus } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { getCurrentUser, getProject } from '../../mockData'
import { formatDate, formatMoney } from '../../utils/format'
import { invoiceStatus, getUserInvoices, otherParty } from './invoiceUtils'
import './invoices.css'

const filters = ['all', 'unpaid', 'paid', 'overdue']

// projectId is passed when this is shown as a tab inside ProjectDetail
function InvoiceList({ projectId }) {
  const user = getCurrentUser()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const isFreelancer = user.role === 'freelancer'

  const myInvoices = getUserInvoices(user)
    .filter((inv) => !projectId || inv.project === projectId)
    .map((inv) => ({ ...inv, status: invoiceStatus(inv) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const shown = filter === 'all' ? myInvoices : myInvoices.filter((inv) => inv.status === filter)
  const count = (f) => (f === 'all' ? myInvoices.length : myInvoices.filter((inv) => inv.status === f).length)
  const newLink = projectId ? `/invoices/new?project=${projectId}` : '/invoices/new'

  return (
    <div className={projectId ? '' : 'page'}>
      <div className="page-header">
        {projectId ? <h3>Invoices</h3> : <h2>Invoices</h2>}
        {isFreelancer && (
          <Link to={newLink}>
            <Button><FiPlus /> New invoice</Button>
          </Link>
        )}
      </div>

      <Card>
        <div className="tabs">
          {filters.map((f) => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f} ({count(f)})
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <EmptyState
            icon={<FiFileText />}
            title={filter === 'all' ? 'No invoices yet' : `No ${filter} invoices`}
            message={isFreelancer && filter === 'all' ? 'Create an invoice from your time entries or milestones.' : ''}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Number</th>
                  {!projectId && <th>Project</th>}
                  <th>{isFreelancer ? 'Client' : 'Freelancer'}</th>
                  <th>Due</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((inv) => (
                  <tr key={inv._id} className="invoice-row" onClick={() => navigate(`/invoices/${inv._id}`)}>
                    <td><Link to={`/invoices/${inv._id}`}>{inv.number}</Link></td>
                    {!projectId && <td>{getProject(inv.project)?.title}</td>}
                    <td>{otherParty(inv, user)?.name}</td>
                    <td>{formatDate(inv.dueDate)}</td>
                    <td><strong>{formatMoney(inv.total)}</strong></td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default InvoiceList
