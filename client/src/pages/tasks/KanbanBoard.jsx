import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { FiPlus, FiCalendar, FiFlag, FiArrowLeft } from 'react-icons/fi'
import Button from '../../components/Button'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import Loader from '../../components/Loader'
import api from '../../api'
import { formatDate, isPast } from '../../utils/format'
import TaskModal from './TaskModal'
import './tasks.css'

const columns = [
  { status: 'todo', title: 'To do' },
  { status: 'doing', title: 'In progress' },
  { status: 'done', title: 'Done' },
]

// projectId is passed when this is shown as a tab inside ProjectDetail
function KanbanBoard({ projectId }) {
  const params = useParams()
  const id = projectId || params.id
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)

  // null = closed, {} = new task, a task = edit that task
  const [modalTask, setModalTask] = useState(null)

  function loadTasks() {
    return api.get('/projects/' + id + '/tasks').then((res) => setTasks(res.data))
  }

  useEffect(() => {
    async function load() {
      try {
        const p = await api.get('/projects/' + id)
        setProject(p.data)
        const m = await api.get('/projects/' + id + '/milestones')
        setMilestones(m.data)
        await loadTasks()
      } catch (err) {
        console.log(err)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <Loader />

  if (!project) {
    return (
      <div className="page">
        <h2>Project not found</h2>
      </div>
    )
  }

  // only the project's freelancer can change tasks, the client can just look
  const canEdit = user._id === project.freelancer._id
  const projectTasks = tasks

  function handleDragEnd(result) {
    const { draggableId, source, destination } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId

    // move it on the screen first so it doesnt jump back while waiting
    const task = tasks.find((t) => t._id === draggableId)
    const others = tasks.filter((t) => t._id !== draggableId)
    const column = others.filter((t) => t.status === newStatus)
    const moved = { ...task, status: newStatus }
    let newList
    if (destination.index < column.length) {
      const before = column[destination.index]
      newList = [...others]
      newList.splice(others.indexOf(before), 0, moved)
    } else {
      newList = [...others, moved]
    }
    setTasks(newList)

    api.patch('/tasks/' + draggableId + '/move', { status: newStatus, index: destination.index })
      .then(() => loadTasks())
      .catch((err) => {
        alert(err.response?.data?.message || 'could not move task')
        loadTasks()
      })
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
          milestones={milestones}
          onClose={() => setModalTask(null)}
          onSaved={() => {
            setModalTask(null)
            loadTasks()
          }}
        />
      )}
    </div>
  )
}

export default KanbanBoard
