import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FiArrowLeft, FiEdit2, FiFolder, FiSend, FiCheckCircle, FiStar } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Stars from '../../components/Stars'
import { useAuth } from '../../context/AuthContext'
import { getProject, getUser, tasks, milestones, timeEntries, proposals, reviews } from '../../mockData'
import { formatDate, formatHours, formatMoney, isPast } from '../../utils/format'
import { addNotification } from '../../utils/notifications'
import { getProgress } from './projectUtils'
import KanbanBoard from '../tasks/KanbanBoard'
import MilestoneList from '../milestones/MilestoneList'
import TimeTracker from '../time/TimeTracker'
import InvoiceList from '../invoices/InvoiceList'
import ChatPage from '../chat/ChatPage'
import './projects.css'

function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // mockData is changed directly, this just tells React to draw again
  const [, setVersion] = useState(0)

  const project = getProject(id)
  const isMember = project && (project.freelancer === user._id || project.client === user._id)

  if (!isMember) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            icon={<FiFolder />}
            title="Project not found"
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

  const isFreelancer = user.role === 'freelancer'
  const freelancer = getUser(project.freelancer)
  const client = getUser(project.client)

  // clients don't track time, so they don't get the time tab
  const tabs = ['overview', 'tasks', 'milestones', 'invoices', 'chat']
  if (isFreelancer) tabs.splice(3, 0, 'time')

  // the open tab lives in the url (?tab=tasks) so it survives a refresh
  const tab = tabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview'

  return (
    <div className="page">
      <Link to="/projects" className="back-link">
        <FiArrowLeft /> All projects
      </Link>

      <div className="page-header">
        <div className="row">
          <h2>{project.title}</h2>
          <StatusBadge status={project.status} />
        </div>
        {isFreelancer && (
          <Link to={`/projects/${project._id}/edit`}>
            <Button variant="secondary">
              <FiEdit2 /> Edit
            </Button>
          </Link>
        )}
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setSearchParams({ tab: t })}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <Overview
          project={project}
          freelancer={freelancer}
          client={client}
          user={user}
          onChange={() => setVersion((v) => v + 1)}
        />
      )}
      {tab === 'tasks' && <KanbanBoard projectId={project._id} />}
      {tab === 'milestones' && <MilestoneList projectId={project._id} />}
      {tab === 'time' && <TimeTracker projectId={project._id} />}
      {tab === 'invoices' && <InvoiceList projectId={project._id} />}
      {tab === 'chat' && <ChatPage projectId={project._id} />}
    </div>
  )
}

function Overview({ project, freelancer, client, user, onChange }) {
  const isFreelancer = user.role === 'freelancer'
  const progress = getProgress(project._id)
  const late = project.status !== 'completed' && isPast(project.deadline)

  const projectTasks = tasks.filter((t) => t.project === project._id)
  const doneTasks = projectTasks.filter((t) => t.status === 'done').length
  const projectMilestones = milestones.filter((m) => m.project === project._id)
  const doneMilestones = projectMilestones.filter((m) => m.completed).length
  const hours = timeEntries.filter((e) => e.project === project._id).reduce((sum, e) => sum + e.hours, 0)

  // latest proposal for this project
  const proposal = proposals
    .filter((p) => p.project === project._id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  return (
    <div className="overview-grid">
      <Card title="About this project">
        <p className="overview-desc">{project.description || 'No description yet.'}</p>

        <div className="detail-list">
          <div>
            <span className="muted">Freelancer</span>
            <Link to={`/users/${freelancer._id}`}>{freelancer.name}</Link>
          </div>
          <div>
            <span className="muted">Client</span>
            <span>{client.name}</span>
          </div>
          <div>
            <span className="muted">Budget</span>
            <span>{formatMoney(project.budget)}</span>
          </div>
          <div>
            <span className="muted">Deadline</span>
            <span className={late ? 'late' : ''}>
              {formatDate(project.deadline)}
              {late && ' (overdue)'}
            </span>
          </div>
          <div>
            <span className="muted">Started</span>
            <span>{formatDate(project.createdAt)}</span>
          </div>
        </div>
      </Card>

      <div className="overview-side">
        <Card title="Progress">
          <div className="progress-label">
            <span className="muted">
              {doneTasks} of {projectTasks.length} tasks done
            </span>
            <span className="muted">{progress}%</span>
          </div>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>

          <div className="stat-row">
            <div>
              <strong>
                {doneMilestones}/{projectMilestones.length}
              </strong>
              <span className="muted">Milestones</span>
            </div>
            <div>
              <strong>{formatHours(hours)}</strong>
              <span className="muted">Time logged</span>
            </div>
          </div>
        </Card>

        <Card title="Proposal">
          {proposal ? (
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <StatusBadge status={proposal.status} />
                <p className="muted" style={{ marginTop: 4 }}>
                  {formatMoney(proposal.amount)} · {proposal.timeline}
                </p>
              </div>
              <Link to={`/proposals/${proposal._id}`}>
                <Button variant="secondary" size="sm">
                  View
                </Button>
              </Link>
            </div>
          ) : isFreelancer ? (
            <div>
              <p className="muted" style={{ marginBottom: 12 }}>
                Send a proposal so the client can accept and start the project.
              </p>
              <Link to={`/projects/${project._id}/proposal/new`}>
                <Button size="sm">
                  <FiSend /> Send proposal
                </Button>
              </Link>
            </div>
          ) : (
            <p className="muted">The freelancer hasn't sent a proposal yet.</p>
          )}
        </Card>

        {project.status !== 'proposal' && (
          <Completion project={project} user={user} client={client} onChange={onChange} />
        )}
      </div>
    </div>
  )
}

// finish the project, then both sides can leave a review
function Completion({ project, user, client, onChange }) {
  const isFreelancer = user._id === project.freelancer
  const myReview = reviews.find((r) => r.project === project._id && r.from === user._id)

  // week 3: this becomes PATCH /api/projects/:id/complete
  function completeProject() {
    const openMilestones = milestones.filter((m) => m.project === project._id && !m.completed).length
    const message =
      openMilestones > 0
        ? `${openMilestones} milestone(s) are not complete yet. Mark the project as complete anyway?`
        : 'Mark this project as complete?'
    if (!window.confirm(message)) return

    project.status = 'completed'
    project.completedAt = new Date().toISOString()
    addNotification(
      client._id,
      `${user.name} marked ${project.title} as complete. Leave a review!`,
      `/projects/${project._id}/review`
    )
    onChange()
  }

  if (project.status === 'active') {
    return (
      <Card title="Completion">
        {isFreelancer ? (
          <>
            <p className="muted" style={{ marginBottom: 12 }}>
              Finished all the work? Mark the project as complete so you can both leave a review.
            </p>
            <Button variant="success" size="sm" onClick={completeProject}>
              <FiCheckCircle /> Mark as complete
            </Button>
          </>
        ) : (
          <p className="muted">The freelancer will mark the project as complete when the work is done.</p>
        )}
      </Card>
    )
  }

  // completed
  return (
    <Card title="Completion">
      <p className="completed-text">
        <FiCheckCircle /> Completed{project.completedAt && ` on ${formatDate(project.completedAt)}`}
      </p>
      {myReview ? (
        <div className="row">
          <span className="muted">Your review:</span>
          <Stars rating={myReview.rating} size={14} />
        </div>
      ) : (
        <Link to={`/projects/${project._id}/review`}>
          <Button size="sm">
            <FiStar /> Leave a review
          </Button>
        </Link>
      )}
    </Card>
  )
}

export default ProjectDetail
