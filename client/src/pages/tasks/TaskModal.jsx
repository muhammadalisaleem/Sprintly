import { useState } from 'react'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { tasks, milestones, newId } from '../../mockData'

// add a new task (task = {}) or edit an existing one
function TaskModal({ task, projectId, onClose, onSaved }) {
  const editing = Boolean(task._id)
  const projectMilestones = milestones.filter((m) => m.project === projectId)

  const [form, setForm] = useState({
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    dueDate: task.dueDate || '',
    milestone: task.milestone || '',
  })
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (!form.title.trim()) {
      setError('Title is required')
      return
    }

    const data = { ...form, title: form.title.trim(), description: form.description.trim() }

    // week 3: these become PUT /api/tasks/:id and POST /api/projects/:id/tasks
    if (editing) {
      Object.assign(task, data)
    } else {
      tasks.push({ _id: newId('t'), project: projectId, ...data })
    }
    onSaved()
  }

  function handleDelete() {
    if (!window.confirm('Delete this task?')) return

    // week 3: this becomes DELETE /api/tasks/:id
    tasks.splice(tasks.indexOf(task), 1)
    onSaved()
  }

  return (
    <Modal open title={editing ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Input label="Title" name="title" value={form.title} onChange={handleChange} error={error} />
        <Input
          as="textarea"
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
        />

        <div className="form-row">
          <Input as="select" label="Status" name="status" value={form.status} onChange={handleChange}>
            <option value="todo">To do</option>
            <option value="doing">In progress</option>
            <option value="done">Done</option>
          </Input>
          <Input as="select" label="Priority" name="priority" value={form.priority} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Input>
        </div>

        <div className="form-row">
          <Input label="Due date" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
          <Input as="select" label="Milestone" name="milestone" value={form.milestone} onChange={handleChange}>
            <option value="">None</option>
            {projectMilestones.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title}
              </option>
            ))}
          </Input>
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
            <Button type="submit">{editing ? 'Save' : 'Add task'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default TaskModal
