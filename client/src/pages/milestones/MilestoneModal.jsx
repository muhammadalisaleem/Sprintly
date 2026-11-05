import { useState } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { milestones, tasks, newId } from '../../mockData'

// add a new milestone (milestone = {}) or edit an existing one
function MilestoneModal({ milestone, projectId, onClose, onSaved }) {
  const editing = Boolean(milestone._id)

  const [form, setForm] = useState({
    title: milestone.title || '',
    dueDate: milestone.dueDate || '',
    amount: milestone.amount || '',
  })
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()

    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.dueDate) errs.dueDate = 'Due date is required'
    if (form.amount === '' || Number(form.amount) < 0) errs.amount = 'Enter an amount (0 is fine)'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const data = { title: form.title.trim(), dueDate: form.dueDate, amount: Number(form.amount) }

    // week 3: these become PUT /api/milestones/:id and POST /api/projects/:id/milestones
    if (editing) {
      Object.assign(milestone, data)
    } else {
      milestones.push({ _id: newId('m'), project: projectId, completed: false, ...data })
    }
    onSaved()
  }

  function handleDelete() {
    if (!window.confirm('Delete this milestone?')) return

    // week 3: this becomes DELETE /api/milestones/:id
    milestones.splice(milestones.indexOf(milestone), 1)

    // tasks linked to it are no longer linked to anything
    tasks.forEach((t) => {
      if (t.milestone === milestone._id) t.milestone = ''
    })
    onSaved()
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
            <Button type="submit">{editing ? 'Save' : 'Add milestone'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default MilestoneModal
