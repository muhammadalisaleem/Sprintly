import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { FiPlus, FiCalendar, FiFlag, FiArrowLeft } from 'react-icons/fi'
import Button from '../../components/Button'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { tasks, milestones, getProject } from '../../mockData'
import { formatDate, isPast } from '../../utils/format'
import TaskModal from './TaskModal'
import './tasks.css'

const columns = [
  { status: 'todo', title: 'To do' },
  { status: 'doing', title: 'In progress' },
  { status: 'done', title: 'Done' },
]

// move a task to a new column and position inside the mockData array
// week 3: this becomes PATCH /api/tasks/:id/move
function moveTask(task, newStatus, newIndex) {
  task.status = newStatus

  tasks.splice(tasks.indexOf(task), 1)
  const column = tasks.filter((t) => t.project === task.project && t.status === newStatus)

  if (newIndex < column.length) {
    tasks.splice(tasks.indexOf(column[newIndex]), 0, task)
  } else if (column.length > 0) {
    tasks.splice(tasks.indexOf(column[column.length - 1]) + 1, 0, task)
  } else {
    tasks.push(task)
  }
}

// projectId is passed when this is shown as a tab inside ProjectDetail
function KanbanBoard({ projectId }) {
  const params = useParams()
  const id = projectId || params.id
  const { user } = useAuth()
  const project = getProject(id)

  // mockData is changed directly, this just tells React to draw again
  const [, setVersion] = useState(0)
  const refresh = () => setVersion((v) => v + 1)

  // null = closed, {} = new task, a task = edit that task
  const [modalTask, setModalTask] = useState(null)

  if (!project) {
    return (
      <div className="page">
        <h2>Project not found</h2>
      </div>
    )
  }

  // only the project's freelancer can change tasks, the client can just look
  const canEdit = user._id === project.freelancer
  const projectTasks = tasks.filter((t) => t.project === id)

  function handleDragEnd(result) {
    const { draggableId, source, destination } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const task = tasks.find((t) => t._id === draggableId)
    moveTask(task, destination.droppableId, destination.index)
    refresh()
  }

  function milestoneName(milestoneId) {
    return milestones.find((m) => m._id === milestoneId)?.title
  }

  return (
    <div className={projectId ? '' : 'page'}>
      {!projectId && (
        <Link to={`/projects/${id}`} className="back-link">
          <FiArrowLeft /> {project.title}
        </Link>
      )}

      <div className="page-header">
        {projectId ? <h3>Tasks</h3> : <h2>Tasks</h2>}
        {canEdit && (
          <Button onClick={() => setModalTask({})}>
            <FiPlus /> Add task
          </Button>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban">
          {columns.map((col) => {
            const colTasks = projectTasks.filter((t) => t.status === col.status)

            return (
              <div key={col.status} className="kanban-column">
                <div className="kanban-column-header">
                  <span>{col.title}</span>
                  <span className="kanban-count">{colTasks.length}</span>
                </div>

                <Droppable droppableId={col.status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={snapshot.isDraggingOver ? 'kanban-list over' : 'kanban-list'}
                    >
                      {colTasks.map((task, index) => {
                        const late = task.status !== 'done' && isPast(task.dueDate)

                        return (
                          <Draggable key={task._id} draggableId={task._id} index={index} isDragDisabled={!canEdit}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={
                                  'task-card' + (snapshot.isDragging ? ' dragging' : '') + (canEdit ? '' : ' readonly')
                                }
                                onClick={() => canEdit && setModalTask(task)}
                              >
                                <div className="task-card-top">
                                  <span className="task-title">{task.title}</span>
                                  <StatusBadge status={task.priority} />
                                </div>

                                {task.description && <p className="muted task-desc">{task.description}</p>}

                                <div className="task-meta">
                                  {task.dueDate && (
                                    <span className={late ? 'late' : ''}>
                                      <FiCalendar /> {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                  {task.milestone && (
                                    <span>
                                      <FiFlag /> {milestoneName(task.milestone)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}

                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <p className="kanban-empty muted">No tasks</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {modalTask && (
        <TaskModal
          task={modalTask}
          projectId={id}
          onClose={() => setModalTask(null)}
          onSaved={() => {
            setModalTask(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}

export default KanbanBoard
