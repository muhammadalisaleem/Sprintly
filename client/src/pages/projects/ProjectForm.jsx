import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiFolder } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import EmptyState from '../../components/EmptyState'
import Loader from '../../components/Loader'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import './projects.css'

// used for both /projects/new and /projects/:id/edit
function ProjectForm() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const editing = Boolean(id)

  const [form, setForm] = useState({
    title: '',
    description: '',
    clientEmail: '',
    budget: '',
    deadline: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(editing)
  const [notAllowed, setNotAllowed] = useState(false)
  const [saving, setSaving] = useState(false)

  // when editing, fill the form with the project
  useEffect(() => {
    if (!editing) return
    api.get('/projects/' + id)
      .then((res) => {
        const p = res.data
        if (p.freelancer._id !== user._id) {
          setNotAllowed(true)
          return
        }
        setForm({
          title: p.title,
          description: p.description || '',
          clientEmail: p.client.email,
          budget: p.budget,
          deadline: p.deadline ? p.deadline.slice(0, 10) : '',
        })
      })
      .catch(() => setNotAllowed(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loader />

  // only freelancers make projects, and only the owner can edit one
  if (user.role !== 'freelancer' || notAllowed) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            icon={<FiFolder />}
            title={editing ? 'Project not found' : 'Only freelancers can create projects'}
            action={
              <Link to="/projects">
                <Button variant="secondary">Back to projects</Button>
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

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!editing && !form.clientEmail.trim()) errs.clientEmail = 'Client email is required'
    if (!form.budget || Number(form.budget) <= 0) errs.budget = 'Budget must be more than 0'
    if (!form.deadline) errs.deadline = 'Deadline is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const errs = validate()
    setErrors(errs)
    setServerError('')
    if (Object.keys(errs).length > 0) return

    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      budget: Number(form.budget),
      deadline: form.deadline,
    }

    setSaving(true)
    try {
      if (editing) {
        await api.put('/projects/' + id, data)
        navigate('/projects/' + id)
      } else {
        const res = await api.post('/projects', { ...data, clientEmail: form.clientEmail.trim().toLowerCase() })
        navigate('/projects/' + res.data._id)
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'could not save project')
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>{editing ? 'Edit project' : 'New project'}</h2>
      </div>

      <Card className="project-form">
        <form onSubmit={handleSubmit}>
          <Input label="Project title" name="title" value={form.title} onChange={handleChange} error={errors.title} />
          <Input
            as="textarea"
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="What is this project about?"
          />
          <Input
            label="Client email"
            name="clientEmail"
            type="email"
            value={form.clientEmail}
            onChange={handleChange}
            error={errors.clientEmail}
            disabled={editing}
            placeholder="client@example.com"
          />

          <div className="form-row">
            <Input
              label="Budget ($)"
              name="budget"
              type="number"
              min="1"
              value={form.budget}
              onChange={handleChange}
              error={errors.budget}
            />
            <Input
              label="Deadline"
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
              error={errors.deadline}
            />
          </div>

          {serverError && <p className="form-error">{serverError}</p>}

          <div className="form-actions">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Create project'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ProjectForm
