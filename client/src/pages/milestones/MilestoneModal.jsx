import { useState } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Button from '../../components/Button'
import api from '../../api'

// add a new milestone (milestone = {}) or edit an existing one
function MilestoneModal({ milestone, projectId, onClose, onSaved }) {
  const editing = Boolean(milestone._id)

  const [form, setForm] = useState({
    title: milestone.title || '',
    dueDate: milestone.dueDate ? milestone.dueDate.slice(0, 10) : '',
    amount: milestone.amount ?? '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.dueDate) errs.dueDate = 'Due date is required'
    if (form.amount === '' || Number(form.amount) < 0) errs.amount = 'Enter an amount (0 is fine)'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const data = { title: form.title.trim(), dueDate: form.dueDate, amount: Number(form.amount) }

    setSaving(true)
    setServerError('')
    try {
      if (editing) {
        await api.put('/milestones/' + milestone._id, data)
      } else {
        await api.post('/projects/' + projectId + '/milestones', data)
      }
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || 'could not save milestone')
      setSaving(false)
    }
  }

  // server also takes the milestone off its tasks
  async function handleDelete() {
    if (!window.confirm('Delete this milestone?')) return

    try {
      await api.delete('/milestones/' + milestone._id)
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || 'could not delete milestone')
    }
  }

  return (
    <Modal open title={editing ? 'Edit milestone' : 'New milestone'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Input label="Title" name="title" value={form.title} onChange={handleChange} error={errors.title} />

        <div className="form-row">
          <Input
            label="Due date"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
            error={errors.dueDate}
          />
          <Input
            label="Amount ($)"
            name="amount"
            type="number"
            min="0"
            value={form.amount}
            onChange={handleChange}
            error={errors.amount}
          />
        </div>

        {serverError && <p className="form-error">{serverError}</p>}

        <div className="modal-actions">
          {editing && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className="row">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save' : 'Add milestone'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default MilestoneModal
