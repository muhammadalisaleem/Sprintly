import { invoices, getUser } from '../../mockData'
import { isPast } from '../../utils/format'

// unpaid invoices past their due date count as overdue
export function invoiceStatus(invoice) {
  if (invoice.status !== 'paid' && isPast(invoice.dueDate)) return 'overdue'
  return invoice.status
}

// invoices the user sent (freelancer) or received (client)
export function getUserInvoices(user) {
  const field = user.role === 'client' ? 'client' : 'freelancer'
  return invoices.filter((inv) => inv[field] === user._id)
}

// the person on the other side of the invoice
export function otherParty(invoice, user) {
  return getUser(user.role === 'client' ? invoice.freelancer : invoice.client)
}

export function nextInvoiceNumber() {
  const max = invoices.reduce((n, inv) => Math.max(n, Number(inv.number.replace('INV-', '')) || 0), 0)
  return 'INV-' + String(max + 1).padStart(3, '0')
}
