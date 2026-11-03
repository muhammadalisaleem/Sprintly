import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiFolder, FiCalendar, FiDollarSign, FiUser, FiEdit2 } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { getUser, getUserProjects } from '../../mockData'
import { formatDate, formatMoney, isPast } from '../../utils/format'
import { getProgress } from './projectUtils'
import './projects.css'

const filters = ['all', 'proposal', 'active', 'completed']

function ProjectList() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')
  const isFreelancer = user.role === 'freelancer'

  // newest first
  const myProjects = getUserProjects(user._id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const shown = filter === 'all' ? myProjects : myProjects.filter((p) => p.status === filter)

  function count(f) {
    if (f === 'all') return myProjects.length
    return myProjects.filter((p) => p.status === f).length
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>{isFreelancer ? 'Projects' : 'My Projects'}</h2>
        {isFreelancer && (
          <Link to="/projects/new">
            <Button>
              <FiPlus /> New project
            </Button>
          </Link>
        )}
      </div>

      <div className="tabs">
        {filters.map((f) => (
          <button key={f} className={filter === f ? 'tab active' : 'tab'} onClick={() => setFilter(f)}>
            {f} ({count(f)})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FiFolder />}
            title={filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
            message={isFreelancer && filter === 'all' ? 'Create your first project to get started.' : ''}
          />
        </Card>
      ) : (
        <div className="project-grid">
          {shown.map((project) => {
            // freelancers see the client, clients see the freelancer
            const other = getUser(isFreelancer ? project.client : project.freelancer)
            const progress = getProgress(project._id)
            const late = project.status !== 'completed' && isPast(project.deadline)

            return (
              <div key={project._id} className="card project-card">
                <div className="project-card-top">
                  <StatusBadge status={project.status} />
                  {isFreelancer && (
                    <Link to={`/projects/${project._id}/edit`} className="edit-link" aria-label="Edit project">
                      <FiEdit2 />
                    </Link>
                  )}
                </div>

                <Link to={`/projects/${project._id}`} className="project-title">
                  {project.title}
                </Link>
                <p className="muted project-desc">{project.description}</p>

                <div className="project-info">
                  <span>
                    <FiUser /> {other ? other.name : 'Unknown'}
                  </span>
                  <span>
                    <FiDollarSign /> {formatMoney(project.budget)}
                  </span>
                  <span className={late ? 'late' : ''}>
                    <FiCalendar /> {formatDate(project.deadline)}
                    {late && ' (overdue)'}
                  </span>
                </div>

                <div className="progress-label">
                  <span className="muted">Progress</span>
                  <span className="muted">{progress}%</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProjectList
