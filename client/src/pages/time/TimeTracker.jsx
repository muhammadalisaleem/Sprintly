import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiPlay, FiSquare, FiTrash2, FiClock } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import EmptyState from '../../components/EmptyState'
import { timeEntries, tasks, getCurrentUser, getUserProjects, newId } from '../../mockData'
import { formatClock, formatDate, formatHours, toInputDate } from '../../utils/format'
import './time.css'

const TIMER_KEY = 'sprintly-timer'

function loadTimer() {
  try {
    return JSON.parse(localStorage.getItem(TIMER_KEY))
  } catch {
    return null
  }
}

function saveTimer(timer) {
  try {
    if (timer) localStorage.setItem(TIMER_KEY, JSON.stringify(timer))
    else localStorage.removeItem(TIMER_KEY)
  } catch {
    // storage blocked, the timer still works until the page is left
  }
}

function emptyForm() {
  return { date: toInputDate(), hours: '', task: '', note: '' }
}

// projectId is passed when this is shown as a tab inside ProjectDetail
function TimeTracker({ projectId }) {
  const user = getCurrentUser()
  const [searchParams] = useSearchParams()
  const myProjects = getUserProjects(user._id).filter((p) => p.status === 'active')

  const [selectedProject, setSelectedProject] = useState(
    projectId || searchParams.get('project') || myProjects[0]?._id || ''
  )
  const [entries, setEntries] = useState(timeEntries)
  const [timer, setTimer] = useState(loadTimer)
  const [elapsed, setElapsed] = useState(0)
  const [timerNote, setTimerNote] = useState(timer?.note || '')
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const currentProject = projectId || selectedProject
  const projectTasks = tasks.filter((t) => t.project === currentProject)

  // tick the running clock every second
  useEffect(() => {
    if (!timer) {
      setElapsed(0)
      return
    }
    const tick = () => setElapsed(Math.floor((Date.now() - timer.startedAt) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [timer])

  function startTimer() {
    const t = { project: currentProject, startedAt: Date.now(), note: timerNote }
    saveTimer(t)
    setTimer(t)
  }

  function stopTimer() {
    const hours = Math.max(0.01, Math.round((elapsed / 3600) * 100) / 100)
    addEntry({
      project: timer.project,
      hours,
      date: toInputDate(),
      note: timerNote || 'Timer',
      task: null,
    })
    saveTimer(null)
    setTimer(null)
    setTimerNote('')
  }

  function addEntry(data) {
    const entry = { _id: newId('te'), user: user._id, invoiced: false, ...data }
    timeEntries.push(entry)
    setEntries([...timeEntries])
  }

  function updateForm(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFormError('')
  }

  function submitManual(e) {
    e.preventDefault()
    const hours = Number(form.hours)
    if (!hours || hours <= 0 || hours > 24) {
      setFormError('Enter hours between 0 and 24')
      return
    }
    addEntry({
      project: currentProject,
      hours,
      date: form.date,
      note: form.note || 'Manual entry',
      task: form.task || null,
    })
    setForm(emptyForm())
  }

  function deleteEntry(id) {
    const index = timeEntries.findIndex((e) => e._id === id)
    if (index !== -1) timeEntries.splice(index, 1)
    setEntries([...timeEntries])
  }

  const projectEntries = entries
    .filter((e) => e.project === currentProject && e.user === user._id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const totalHours = projectEntries.reduce((sum, e) => sum + e.hours, 0)
  const timerOnOtherProject = timer && timer.project !== currentProject

  if (myProjects.length === 0 && !projectId) {
    return (
      <div className="page">
        <h2>Time Tracker</h2>
        <EmptyState icon={<FiClock />} title="No active projects" message="Time can be tracked once a project is active." />
      </div>
    )
  }

  return (
    <div className={projectId ? '' : 'page'}>
      {!projectId && (
        <div className="page-header">
          <h2>Time Tracker</h2>
          <select
            className="input time-project-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            aria-label="Project"
          >
            {myProjects.map((p) => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="time-layout">
        <Card title="Timer">
          <div className={`timer-clock ${timer && !timerOnOtherProject ? 'running' : ''}`}>
            {formatClock(timerOnOtherProject ? 0 : elapsed)}
          </div>
          <Input
            name="timerNote"
            placeholder="What are you working on?"
            value={timerNote}
            onChange={(e) => setTimerNote(e.target.value)}
            disabled={!!timer}
          />
          {timerOnOtherProject ? (
            <p className="muted">A timer is already running on another project.</p>
          ) : timer ? (
            <Button variant="danger" full onClick={stopTimer}>
              <FiSquare /> Stop
            </Button>
          ) : (
            <Button variant="success" full onClick={startTimer} disabled={!currentProject}>
              <FiPlay /> Start
            </Button>
          )}
        </Card>

        <Card title="Add time manually">
          <form onSubmit={submitManual} noValidate>
            <div className="form-row">
              <Input label="Date" type="date" name="date" value={form.date} onChange={updateForm} />
              <Input
                label="Hours"
                type="number"
                name="hours"
                min="0.25"
                max="24"
                step="0.25"
                placeholder="2"
                value={form.hours}
                onChange={updateForm}
                error={formError}
              />
            </div>
            <Input label="Task (optional)" as="select" name="task" value={form.task} onChange={updateForm}>
              <option value="">No task</option>
              {projectTasks.map((t) => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </Input>
            <Input label="Note" name="note" placeholder="What did you do?" value={form.note} onChange={updateForm} />
            <Button type="submit" variant="primary" full disabled={!currentProject}>Add entry</Button>
          </form>
        </Card>
      </div>

      <Card
        title="Time entries"
        className="time-entries"
        actions={<span className="muted">Total: <strong>{formatHours(totalHours)}</strong></span>}
      >
        {projectEntries.length === 0 ? (
          <EmptyState icon={<FiClock />} title="No time logged yet" message="Start the timer or add an entry." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Note</th>
                  <th>Task</th>
                  <th>Hours</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projectEntries.map((e) => (
                  <tr key={e._id}>
                    <td>{formatDate(e.date)}</td>
                    <td>{e.note}</td>
                    <td className="muted">{projectTasks.find((t) => t._id === e.task)?.title || '—'}</td>
                    <td>{formatHours(e.hours)}</td>
                    <td>
                      {e.invoiced ? (
                        <span className="badge badge-green">invoiced</span>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => deleteEntry(e._id)} aria-label="Delete entry">
                          <FiTrash2 />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default TimeTracker
