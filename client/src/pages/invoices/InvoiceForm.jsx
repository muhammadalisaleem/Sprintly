import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiPlus, FiTrash2, FiClock, FiFlag } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import EmptyState from '../../components/EmptyState'
import Loader from '../../components/Loader'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { formatMoney, toInputDate } from '../../utils/format'
import './invoices.css'

// keys for the rows in the table
let nextKey = 1
function emptyItem() {
  return { key: nextKey++, description: '', qty: 1, rate: 0 }
}

function defaultDueDate() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return toInputDate(d)
}

function InvoiceForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [myProjects, setMyProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [projectId, setProjectId] = useState('')

  // things on the picked project that can still be billed
  const [openEntries, setOpenEntries] = useState([])
  const [openMilestones, setOpenMilestones] = useState([])

  const [dueDate, setDueDate] = useState(defaultDueDate)
  const [items, setItems] = useState([emptyItem()])
  const [errors, setErrors] = useState({})
  const [info, setInfo] = useState('')
  const [saving, setSaving] = useState(false)

  // my projects that the client already accepted
  useEffect(() => {
    api.get('/projects')
      .then((res) => {
        const list = res.data.filter((p) => p.freelancer._id === user._id && p.status !== 'proposal')
        setMyProjects(list)
        const start = searchParams.get('project')
        setProjectId(list.some((p) => p._id === start) ? start : list[0]?._id || '')
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false))
  }, [])

  // load uninvoiced time and unbilled completed milestones of the project
  useEffect(() => {
    if (!projectId) return
    async function load() {
      try {
        const time = await api.get('/projects/' + projectId + '/time')
        setOpenEntries(time.data.entries.filter((e) => !e.invoiced && e.user?._id === user._id))

        const ms = await api.get('/projects/' + projectId + '/milestones')
        const inv = await api.get('/invoices?project=' + projectId)
        const billed = []
        inv.data.forEach((i) => i.items.forEach((item) => item.milestone && billed.push(item.milestone)))
        setOpenMilestones(ms.data.filter((m) => m.completed && !billed.includes(m._id)))
      } catch (err) {
        console.log(err)
      }
    }
    load()
  }, [projectId])

  if (loading) return <Loader />

  const total = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0), 0)

  // not the ones already added to the list
  const addedEntries = items.map((i) => i.timeEntry).filter(Boolean)
  const availableEntries = openEntries.filter((e) => !addedEntries.includes(e._id))
  const addedMilestones = items.map((i) => i.milestone).filter(Boolean)
  const availableMilestones = openMilestones.filter((m) => !addedMilestones.includes(m._id))

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
    // server bills time at my hourly rate
    const rows = availableEntries.map((e) => ({
      key: nextKey++,
      description: `${e.note || 'Work'} (${e.hours} h)`,
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
      key: nextKey++,
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

  async function handleSubmit(e) {
    e.preventDefault()
    const found = validate()
    if (Object.keys(found).length) {
      setErrors(found)
      return
    }

    // typed lines go as items, time and milestones go as ids (server makes their lines)
    const data = {
      project: projectId,
      dueDate,
      items: items
        .filter((i) => i.description.trim() && !i.timeEntry && !i.milestone)
        .map((i) => ({ description: i.description.trim(), qty: Number(i.qty), rate: Number(i.rate) })),
      timeEntries: items.filter((i) => i.timeEntry).map((i) => i.timeEntry),
      milestones: items.filter((i) => i.milestone).map((i) => i.milestone),
    }

    setSaving(true)
    try {
      const res = await api.post('/invoices', data)
      navigate(`/invoices/${res.data._id}`)
    } catch (err) {
      setErrors({ items: err.response?.data?.message || 'could not create invoice' })
      setSaving(false)
    }
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
                  {items.map((item) => {
                    // lines from time or milestones are worked out by the server, so no editing them
                    const locked = Boolean(item.timeEntry || item.milestone)
                    return (
                      <tr key={item.key}>
                        <td>
                          <Input
                            name={`desc-${item.key}`}
                            aria-label="Description"
                            placeholder="e.g. Homepage design"
                            value={item.description}
                            disabled={locked}
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
                            disabled={locked}
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
                            disabled={locked}
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
                    )
                  })}
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
            <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create invoice'}</Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

export default InvoiceForm
