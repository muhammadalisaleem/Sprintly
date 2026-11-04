import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiPlus, FiTrash2, FiFileText } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import EmptyState from '../../components/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { proposals, getProject, newId } from '../../mockData'
import { addNotification } from '../../utils/notifications'
import './proposals.css'

function ProposalForm() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const project = getProject(id)

  const [form, setForm] = useState({
    scope: '',
    amount: project ? project.budget : '',
    timeline: '',
  })
  const [deliverables, setDeliverables] = useState([''])
  const [errors, setErrors] = useState({})

  // a new proposal is only allowed when there is no pending or accepted one
  const openProposal = proposals.find((p) => p.project === id && p.status !== 'rejected')

  if (!project || project.freelancer !== user._id || openProposal) {
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

  function handleSubmit(e) {
    e.preventDefault()

    const filled = deliverables.map((d) => d.trim()).filter(Boolean)
    const errs = {}
    if (!form.scope.trim()) errs.scope = 'Describe the work you will do'
    if (filled.length === 0) errs.deliverables = 'Add at least one deliverable'
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Amount must be more than 0'
    if (!form.timeline.trim()) errs.timeline = 'Timeline is required'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    // week 3: this becomes POST /api/projects/:id/proposals
    const proposal = {
      _id: newId('pr'),
      project: id,
      scope: form.scope.trim(),
      deliverables: filled,
      amount: Number(form.amount),
      timeline: form.timeline.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    proposals.push(proposal)
    addNotification(project.client, `${user.name} sent you a proposal for ${project.title}`, `/proposals/${proposal._id}`)
    navigate(`/proposals/${proposal._id}`)
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

          <div className="form-actions">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit">Send proposal</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ProposalForm
