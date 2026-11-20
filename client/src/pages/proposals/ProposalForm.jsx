import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiPlus, FiTrash2, FiFileText } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import EmptyState from '../../components/EmptyState'
import Loader from '../../components/Loader'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import './proposals.css'

function ProposalForm() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [openProposal, setOpenProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ scope: '', amount: '', timeline: '' })
  const [deliverables, setDeliverables] = useState([''])
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    api.get('/projects/' + id)
      .then((res) => {
        setProject(res.data)
        setForm((f) => ({ ...f, amount: res.data.budget }))
        return api.get('/proposals/project/' + id)
      })
      .then((res) => {
        // a new proposal is only allowed when there is no pending or accepted one
        setOpenProposal(res.data.find((p) => p.status !== 'rejected') || null)
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loader />

  if (!project || project.freelancer._id !== user._id || openProposal) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            icon={<FiFileText />}
            title={openProposal ? 'This project already has a proposal' : 'Project not found'}
            action={
              <Link to={openProposal ? `/proposals/${openProposal._id}` : '/projects'}>
                <Button variant="secondary">{openProposal ? 'View proposal' : 'Back to projects'}</Button>
              </Link>
            }
          />
        </Card>
      </div>
    )
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function changeDeliverable(index, value) {
    const copy = [...deliverables]
    copy[index] = value
    setDeliverables(copy)
  }

  function removeDeliverable(index) {
    setDeliverables(deliverables.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const filled = deliverables.map((d) => d.trim()).filter(Boolean)
    const errs = {}
    if (!form.scope.trim()) errs.scope = 'Describe the work you will do'
    if (filled.length === 0) errs.deliverables = 'Add at least one deliverable'
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Amount must be more than 0'
    if (!form.timeline.trim()) errs.timeline = 'Timeline is required'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSending(true)
    setServerError('')
    try {
      const res = await api.post('/proposals', {
        project: id,
        scope: form.scope.trim(),
        deliverables: filled,
        amount: Number(form.amount),
        timeline: form.timeline.trim()
      })
      navigate('/proposals/' + res.data._id)
    } catch (err) {
      setServerError(err.response?.data?.message || 'could not send proposal')
      setSending(false)
    }
  }

  return (
    <div className="page">
      <Link to={`/projects/${id}`} className="back-link">
        <FiArrowLeft /> {project.title}
      </Link>

      <div className="page-header">
        <h2>New proposal</h2>
      </div>

      <Card className="proposal-form">
        <form onSubmit={handleSubmit}>
          <Input
            as="textarea"
            label="Scope of work"
            name="scope"
            value={form.scope}
            onChange={handleChange}
            error={errors.scope}
            placeholder="What will you build or do for the client?"
          />

          <div className="form-group">
            <label>Deliverables</label>
            {deliverables.map((d, index) => (
              <div key={index} className="deliverable-row">
                <input
                  className="input"
                  value={d}
                  onChange={(e) => changeDeliverable(index, e.target.value)}
                  placeholder={`Deliverable ${index + 1}`}
                />
                {deliverables.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeDeliverable(index)} aria-label="Remove">
                    <FiTrash2 />
                  </Button>
                )}
              </div>
            ))}
            {errors.deliverables && <span className="form-error">{errors.deliverables}</span>}
            <div>
              <Button variant="secondary" size="sm" onClick={() => setDeliverables([...deliverables, ''])}>
                <FiPlus /> Add deliverable
              </Button>
            </div>
          </div>

          <div className="form-row">
            <Input
              label="Amount ($)"
              name="amount"
              type="number"
              min="1"
              value={form.amount}
              onChange={handleChange}
              error={errors.amount}
            />
            <Input
              label="Timeline"
              name="timeline"
              value={form.timeline}
              onChange={handleChange}
              error={errors.timeline}
              placeholder="e.g. 6 weeks"
            />
          </div>

          {serverError && <p className="form-error">{serverError}</p>}

          <div className="form-actions">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Send proposal'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ProposalForm
