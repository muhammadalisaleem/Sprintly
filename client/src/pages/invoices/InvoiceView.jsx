import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiPrinter, FiCheck } from 'react-icons/fi'
import Button from '../../components/Button'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { invoices, getCurrentUser, getProject, getUser } from '../../mockData'
import { formatDate, formatMoney } from '../../utils/format'
import { addNotification } from '../../utils/notifications'
import { invoiceStatus } from './invoiceUtils'
import './invoices.css'

function InvoiceView() {
  const { id } = useParams()
  const user = getCurrentUser()
  const invoice = invoices.find((inv) => inv._id === id)
  const [, refresh] = useState(0)

  if (!invoice) {
    return (
      <div className="page">
        <EmptyState
          title="Invoice not found"
          action={<Link to="/invoices"><Button variant="secondary">Back to invoices</Button></Link>}
        />
      </div>
    )
  }

  const project = getProject(invoice.project)
  const freelancer = getUser(invoice.freelancer)
  const client = getUser(invoice.client)
  const status = invoiceStatus(invoice)
  const isClient = user._id === invoice.client

  function markPaid() {
    invoice.status = 'paid'
    invoice.paidAt = new Date().toISOString()
    addNotification(invoice.freelancer, `${client.name} paid invoice ${invoice.number}`, `/invoices/${invoice._id}`)
    refresh((n) => n + 1)
  }

  return (
    <div className="page">
      <div className="page-header no-print">
        <Link to="/invoices"><Button variant="ghost"><FiArrowLeft /> Invoices</Button></Link>
        <div className="row">
          <Button variant="secondary" onClick={() => window.print()}>
            <FiPrinter /> Print
          </Button>
          {status !== 'paid' && isClient && (
            <Button variant="success" onClick={markPaid}>
              <FiCheck /> Mark as paid
            </Button>
          )}
        </div>
      </div>

      {status !== 'paid' && !isClient && (
        <p className="muted no-print" style={{ marginBottom: 12 }}>
          {client?.name} marks this invoice as paid once the payment is made.
        </p>
      )}

      <div className="invoice-paper">
        <div className="invoice-paper-header">
          <div>
            <div className="invoice-brand">Sprintly</div>
            <p className="muted">Invoice</p>
          </div>
          <div>
            <h2 className="invoice-number">{invoice.number}</h2>
            <div style={{ textAlign: 'right' }}><StatusBadge status={status} /></div>
          </div>
        </div>

        <div className="invoice-parties">
          <div>
            <div className="invoice-label">From</div>
            <strong>{freelancer?.name}</strong>
            <div className="muted">{freelancer?.email}</div>
          </div>
          <div>
            <div className="invoice-label">Bill to</div>
            <strong>{client?.name}</strong>
            <div className="muted">{client?.email}</div>
          </div>
          <div>
            <div className="invoice-label">Details</div>
            <div>Project: {project?.title}</div>
            <div>Issued: {formatDate(invoice.createdAt)}</div>
            <div>Due: {formatDate(invoice.dueDate)}</div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.description}</td>
                  <td>{item.qty}</td>
                  <td>{formatMoney(item.rate)}</td>
                  <td style={{ textAlign: 'right' }}>{formatMoney(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-total">
          <span>Total</span>
          <strong>{formatMoney(invoice.total)}</strong>
        </div>

        {status === 'paid' && (
          <p className="invoice-paid-note">Paid on {formatDate(invoice.paidAt)}. Thank you!</p>
        )}
      </div>
    </div>
  )
}

export default InvoiceView
