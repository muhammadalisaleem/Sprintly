import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiPlus, FiTrash2, FiClock, FiFlag } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import EmptyState from '../../components/EmptyState'
import {
  invoices, timeEntries, milestones,
  getCurrentUser, getUserProjects, getProject, newId,
} from '../../mockData'
import { formatMoney, toInputDate } from '../../utils/format'
import { addNotification } from '../../utils/notifications'
import { nextInvoiceNumber } from './invoiceUtils'
import './invoices.css'

function emptyItem() {
  return { key: newId('item'), description: '', qty: 1, rate: 0 }
}

function defaultDueDate() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return toInputDate(d)
}

function InvoiceForm() {
  const user = getCurrentUser()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const myProjects = getUserProjects(user._id).filter((p) => p.freelancer === user._id && p.status !== 'proposal')

  const startProject = searchParams.get('project')
  const [projectId, setProjectId] = useState(
    myProjects.some((p) => p._id === startProject) ? startProject : myProjects[0]?._id || ''
  )
  const [dueDate, setDueDate] = useState(defaultDueDate)
  const [items, setItems] = useState([emptyItem()])
  const [errors, setErrors] = useState({})
  const [info, setInfo] = useState('')

  const total = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0), 0)

  // uninvoiced time on this project that is not already in the list
  const addedEntries = items.map((i) => i.timeEntry).filter(Boolean)
  const availableEntries = timeEntries.filter(
    (e) => e.project === projectId && e.user === user._id && !e.invoiced && !addedEntries.includes(e._id)
  )

  // completed milestones not billed in an earlier invoice or already in the list
  const billedTitles = invoices
    .filter((inv) => inv.project === projectId)
    .flatMap((inv) => inv.items.map((i) => i.description))
  const addedMilestones = items.map((i) => i.milestone).filter(Boolean)
  const availableMilestones = milestones.filter(
    (m) =>
      m.project === projectId &&
      m.completed &&
      !billedTitles.includes(`Milestone: ${m.title}`) &&
      !addedMilestones.includes(m._id)
  )

  function changeProject(id) {
    setProjectId(id)
    setItems([emptyItem()])
    setInfo('')
  }

  function updateItem(key, field, value) {
    setItems(items.map((item) => (item.key === key ? { ...item, [field]: value } : item)))
    setErrors({})
  }

  function removeItem(key) {
    const rest = items.filter((item) => item.key !== key)
    setItems(rest.length ? rest : [emptyItem()])
  }

  // drop the blank starter row before adding generated rows
  function withoutBlank(list) {
    return list.filter((i) => i.description || Number(i.rate))
  }

  function addFromTime() {
    if (availableEntries.length === 0) {
      setInfo('No uninvoiced time entries on this project.')
      return
    }
    const rows = availableEntries.map((e) => ({
      key: newId('item'),
      description: `${e.note} (${e.hours} h)`,
      qty: e.hours,
      rate: user.hourlyRate,
      timeEntry: e._id,
    }))
    setItems([...withoutBlank(items), ...rows])
    setInfo(`Added ${rows.length} time ${rows.length === 1 ? 'entry' : 'entries'} at ${formatMoney(user.hourlyRate)}/h.`)
    setErrors({})
  }

  function addFromMilestones() {
    if (availableMilestones.length === 0) {
      setInfo('No completed milestones left to bill on this project.')
      return
    }
    const rows = availableMilestones.map((m) => ({
      key: newId('item'),
      description: `Milestone: ${m.title}`,
      qty: 1,
      rate: m.amount,
      milestone: m._id,
    }))
    setItems([...withoutBlank(items), ...rows])
    setInfo(`Added ${rows.length} completed ${rows.length === 1 ? 'milestone' : 'milestones'}.`)
    setErrors({})
  }

  function validate() {
    const e = {}
    if (!projectId) e.project = 'Pick a project'
    if (!dueDate) e.dueDate = 'Pick a due date'
    const filled = items.filter((i) => i.description.trim())
    if (filled.length === 0) e.items = 'Add at least one line item'
    else if (filled.some((i) => Number(i.qty) <= 0 || Number(i.rate) < 0)) e.items = 'Quantity must be above 0 and rate cannot be negative'
    else if (total <= 0) e.items = 'The total must be more than $0'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const found = validate()
    if (Object.keys(found).length) {
      setErrors(found)
      return
    }

    const project = getProject(projectId)
    const lineItems = items
      .filter((i) => i.description.trim())
      .map((i) => ({
        description: i.description.trim(),
        qty: Number(i.qty),
        rate: Number(i.rate),
        amount: Number(i.qty) * Number(i.rate),
      }))

    const invoice = {
      _id: newId('inv'),
      number: nextInvoiceNumber(),
      project: projectId,
      freelancer: user._id,
      client: project.client,
      items: lineItems,
      total: lineItems.reduce((sum, i) => sum + i.amount, 0),
      status: 'unpaid',
      dueDate,
      paidAt: null,
      createdAt: new Date().toISOString(),
    }
    invoices.push(invoice)

    // billed time can't be billed twice
    items.forEach((i) => {
      const entry = timeEntries.find((t) => t._id === i.timeEntry)
      if (entry) entry.invoiced = true
    })

    addNotification(project.client, `${user.name} sent you invoice ${invoice.number}`, `/invoices/${invoice._id}`)

    navigate(`/invoices/${invoice._id}`)
  }

  if (user.role !== 'freelancer') {
    return (
      <div className="page">
        <EmptyState title="Only freelancers can create invoices" />
      </div>
    )
  }

  if (myProjects.length === 0) {
    return (
      <div className="page">
        <h2>New invoice</h2>
        <EmptyState title="No projects to bill" message="Invoices can be created once a client accepts a proposal." />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>New invoice</h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Card className="grid">
          <div className="invoice-form-top">
            <Input
              label="Project"
              as="select"
              name="project"
              value={projectId}
              onChange={(e) => changeProject(e.target.value)}
              error={errors.project}
            >
              {myProjects.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </Input>
            <Input
              label="Due date"
              type="date"
              name="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              error={errors.dueDate}
            />
          </div>

          <div>
            <div className="page-header" style={{ marginBottom: 12 }}>
              <h3>Line items</h3>
              <div className="row">
                <Button variant="secondary" size="sm" onClick={addFromTime}>
                  <FiClock /> Add from time entries
                </Button>
                <Button variant="secondary" size="sm" onClick={addFromMilestones}>
                  <FiFlag /> Add from milestones
                </Button>
              </div>
            </div>
            {info && <p className="muted" style={{ marginBottom: 12 }}>{info}</p>}

            <div className="table-wrap">
              <table className="table items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty / hours</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.key}>
                      <td>
                        <Input
                          name={`desc-${item.key}`}
                          aria-label="Description"
                          placeholder="e.g. Homepage design"
                          value={item.description}
                          onChange={(e) => updateItem(item.key, 'description', e.target.value)}
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          name={`qty-${item.key}`}
                          aria-label="Quantity"
                          min="0"
                          step="0.25"
                          value={item.qty}
                          onChange={(e) => updateItem(item.key, 'qty', e.target.value)}
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          name={`rate-${item.key}`}
                          aria-label="Rate"
                          min="0"
                          step="1"
                          value={item.rate}
                          onChange={(e) => updateItem(item.key, 'rate', e.target.value)}
                        />
                      </td>
                      <td>{formatMoney(Number(item.qty || 0) * Number(item.rate || 0))}</td>
                      <td>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.key)} aria-label="Remove item">
                          <FiTrash2 />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {errors.items && <p className="form-error" style={{ marginTop: 8 }}>{errors.items}</p>}

            <Button variant="ghost" size="sm" onClick={() => setItems([...items, emptyItem()])} style={{ marginTop: 8 }}>
              <FiPlus /> Add line
            </Button>

            <div className="invoice-total">
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit">Create invoice</Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

export default InvoiceForm
