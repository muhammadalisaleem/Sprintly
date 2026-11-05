import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiPlus, FiFlag, FiCheck, FiRotateCcw, FiEdit2, FiArrowLeft } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { milestones, getProject } from '../../mockData'
import { formatDate, formatMoney, isPast } from '../../utils/format'
import { addNotification } from '../../utils/notifications'
import MilestoneModal from './MilestoneModal'
import './milestones.css'

// projectId is passed when this is shown as a tab inside ProjectDetail
function MilestoneList({ projectId }) {
  const params = useParams()
  const id = projectId || params.id
  const { user } = useAuth()
  const project = getProject(id)

  // mockData is changed directly, this just tells React to draw again
  const [, setVersion] = useState(0)
  const refresh = () => setVersion((v) => v + 1)

  // null = closed, {} = new milestone, a milestone = edit it
  const [modalMilestone, setModalMilestone] = useState(null)

  if (!project) {
    return (
      <div className="page">
        <h2>Project not found</h2>
      </div>
    )
  }

  // only the project's freelancer can change milestones
  const canEdit = user._id === project.freelancer

  // soonest due first
  const list = milestones
    .filter((m) => m.project === id)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const doneCount = list.filter((m) => m.completed).length
  const percent = list.length ? Math.round((doneCount / list.length) * 100) : 0
  const totalAmount = list.reduce((sum, m) => sum + m.amount, 0)
  const doneAmount = list.filter((m) => m.completed).reduce((sum, m) => sum + m.amount, 0)

  // week 3: this becomes PATCH /api/milestones/:id/complete
  function toggleComplete(milestone) {
    milestone.completed = !milestone.completed
    if (milestone.completed) {
      addNotification(
        project.client,
        `Milestone "${milestone.title}" was marked complete`,
        `/projects/${project._id}?tab=milestones`
      )
    }
    refresh()
  }

  return (
    <div className={projectId ? '' : 'page'}>
      {!projectId && (
        <Link to={`/projects/${id}`} className="back-link">
          <FiArrowLeft /> {project.title}
        </Link>
      )}

      <div className="page-header">
        {projectId ? <h3>Milestones</h3> : <h2>Milestones</h2>}
        {canEdit && (
          <Button onClick={() => setModalMilestone({})}>
            <FiPlus /> Add milestone
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FiFlag />}
            title="No milestones yet"
            message={canEdit ? 'Split the project into steps with a date and an amount.' : ''}
          />
        </Card>
      ) : (
        <>
          <Card className="milestone-summary">
            <div className="progress-label">
              <span className="muted">
                {doneCount} of {list.length} milestones complete
              </span>
              <span className="muted">{percent}%</span>
            </div>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${percent}%` }} />
            </div>
            <p className="muted milestone-money">
              {formatMoney(doneAmount)} of {formatMoney(totalAmount)} delivered
            </p>
          </Card>

          <Card>
            {list.map((m) => {
              const late = !m.completed && isPast(m.dueDate)

              return (
                <div key={m._id} className={m.completed ? 'milestone done' : late ? 'milestone late' : 'milestone'}>
                  <span className="milestone-icon">{m.completed ? <FiCheck /> : <FiFlag />}</span>

                  <div className="milestone-info">
                    <strong>{m.title}</strong>
                    <span className="milestone-date">
                      Due {formatDate(m.dueDate)}
                      {late && ' · overdue'}
                      {m.completed && ' · complete'}
                    </span>
                  </div>

                  <span className="milestone-amount">{formatMoney(m.amount)}</span>

                  {canEdit && (
                    <div className="row">
                      <Button
                        variant={m.completed ? 'secondary' : 'success'}
                        size="sm"
                        onClick={() => toggleComplete(m)}
                      >
                        {m.completed ? (
                          <>
                            <FiRotateCcw /> Undo
                          </>
                        ) : (
                          <>
                            <FiCheck /> Complete
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setModalMilestone(m)} aria-label="Edit">
                        <FiEdit2 />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </Card>
        </>
      )}

      {modalMilestone && (
        <MilestoneModal
          milestone={modalMilestone}
          projectId={id}
          onClose={() => setModalMilestone(null)}
          onSaved={() => {
            setModalMilestone(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}

export default MilestoneList
