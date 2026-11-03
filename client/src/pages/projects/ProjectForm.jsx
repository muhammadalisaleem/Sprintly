import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiFolder } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import EmptyState from '../../components/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { projects, users, getProject, getUser, newId } from '../../mockData'
import { addNotification } from '../../utils/notifications'
import './projects.css'

// used for both /projects/new and /projects/:id/edit
function ProjectForm() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const editing = Boolean(id)
  const project = editing ? getProject(id) : null

  const [form, setForm] = useState({
    title: project ? project.title : '',
    description: project ? project.description : '',
    clientEmail: project ? getUser(project.client)?.email || '' : '',
    budget: project ? project.budget : '',
    deadline: project ? project.deadline : '',
  })
  const [errors, setErrors] = useState({})

  // only freelancers make projects, and only the owner can edit one
  if (user.role !== 'freelancer' || (editing && (!project || project.freelancer !== user._id))) {
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

  function findClient(email) {
    return users.find((u) => u.role === 'client' && u.email.toLowerCase() === email.trim().toLowerCase())
  }

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!editing) {
      if (!form.clientEmail.trim()) errs.clientEmail = 'Client email is required'
      else if (!findClient(form.clientEmail)) errs.clientEmail = 'No client account found with this email'
    }
    if (!form.budget || Number(form.budget) <= 0) errs.budget = 'Budget must be more than 0'
    if (!form.deadline) errs.deadline = 'Deadline is required'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()

    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    // week 3: these become PUT /api/projects/:id and POST /api/projects
    if (editing) {
      project.title = form.title.trim()
      project.description = form.description.trim()
      project.budget = Number(form.budget)
      project.deadline = form.deadline
      navigate(`/projects/${project._id}`)
      return
    }

    const client = findClient(form.clientEmail)
    const newProject = {
      _id: newId('p'),
      title: form.title.trim(),
      description: form.description.trim(),
      freelancer: user._id,
      client: client._id,
      budget: Number(form.budget),
      deadline: form.deadline,
      status: 'proposal', // becomes active when the client accepts the proposal
      createdAt: new Date().toISOString(),
    }
    projects.push(newProject)
    addNotification(client._id, `${user.name} added you to the project ${newProject.title}`, `/projects/${newProject._id}`)
    navigate(`/projects/${newProject._id}`)
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

          <div className="form-actions">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save changes' : 'Create project'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ProjectForm
