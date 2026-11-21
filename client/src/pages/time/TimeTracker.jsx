import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiPlay, FiSquare, FiTrash2, FiClock } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import EmptyState from '../../components/EmptyState'
import Loader from '../../components/Loader'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { formatClock, formatDate, formatHours, toInputDate } from '../../utils/format'
import './time.css'

// the running timer is kept per user so two accounts on one browser dont share it
function timerKey(userId) {
  return 'sprintly-timer-' + userId
}

function loadTimer(userId) {
  try {
    return JSON.parse(localStorage.getItem(timerKey(userId)))
  } catch {
    return null
  }
}

function saveTimer(userId, timer) {
  try {
    if (timer) localStorage.setItem(timerKey(userId), JSON.stringify(timer))
    else localStorage.removeItem(timerKey(userId))
  } catch {
    // storage blocked, the timer still works until the page is left
  }
}

function emptyForm() {
  return { date: toInputDate(), hours: '', task: '', note: '' }
}

// projectId is passed when this is shown as a tab inside ProjectDetail
function TimeTracker({ projectId }) {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [myProjects, setMyProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(!projectId)
  const [selectedProject, setSelectedProject] = useState(projectId || searchParams.get('project') || '')

  const [entries, setEntries] = useState([])
  const [totalHours, setTotalHours] = useState(0)
  const [projectTasks, setProjectTasks] = useState([])

  const [timer, setTimer] = useState(() => loadTimer(user._id))
  const [elapsed, setElapsed] = useState(0)
  const [timerNote, setTimerNote] = useState(timer?.note || '')
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [error, setError] = useState('')

  const currentProject = projectId || selectedProject

  // my active projects for the dropdown (only on the /time page)
  useEffect(() => {
    if (projectId) return
    api.get('/projects')
      .then((res) => {
        const active = res.data.filter((p) => p.status === 'active' && p.freelancer._id === user._id)
        setMyProjects(active)
        if (!selectedProject && active.length > 0) setSelectedProject(active[0]._id)
      })
      .catch(() => setError('could not load projects'))
      .finally(() => setLoadingProjects(false))
  }, [])

  function loadEntries() {
    if (!currentProject) return
    api.get('/projects/' + currentProject + '/time')
      .then((res) => {
        setEntries(res.data.entries)
        setTotalHours(res.data.totalHours)
      })
      .catch(() => setError('could not load time entries'))
  }

  // entries + tasks of the picked project
  useEffect(() => {
    if (!currentProject) return
    setError('')
    loadEntries()
    api.get('/projects/' + currentProject + '/tasks')
      .then((res) => setProjectTasks(res.data))
      .catch(() => setProjectTasks([]))
  }, [currentProject])

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
    saveTimer(user._id, t)
    setTimer(t)
  }

  async function stopTimer() {
    const hours = Math.max(0.01, Math.round((elapsed / 3600) * 100) / 100)
    const ok = await addEntry(timer.project, {
      hours,
      date: toInputDate(),
      note: timerNote || 'Timer',
    })
    if (!ok) return
    saveTimer(user._id, null)
    setTimer(null)
    setTimerNote('')
  }

  async function addEntry(project, data) {
    try {
      await api.post('/projects/' + project + '/time', data)
      loadEntries()
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'could not save time')
      return false
    }
  }

  function updateForm(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFormError('')
  }

  async function submitManual(e) {
    e.preventDefault()
    const hours = Number(form.hours)
    if (!hours || hours <= 0 || hours > 24) {
      setFormError('Enter hours between 0 and 24')
      return
    }
    const ok = await addEntry(currentProject, {
      hours,
      date: form.date,
      note: form.note || 'Manual entry',
      task: form.task || undefined,
    })
    if (ok) setForm(emptyForm())
  }

  async function deleteEntry(id) {
    if (!window.confirm('Delete this entry?')) return
    try {
      await api.delete('/time/' + id)
      loadEntries()
    } catch (err) {
      setError(err.response?.data?.message || 'could not delete entry')
    }
  }

  const timerOnOtherProject = timer && timer.project !== currentProject

  if (loadingProjects) return <Loader />

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

      {error && <p className="form-error">{error}</p>}

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
        {entries.length === 0 ? (
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
                {entries.map((e) => (
                  <tr key={e._id}>
                    <td>{formatDate(e.date)}</td>
                    <td>{e.note}</td>
                    <td className="muted">{e.task?.title || '—'}</td>
                    <td>{formatHours(e.hours)}</td>
                    <td>
                      {e.invoiced ? (
                        <span className="badge badge-green">invoiced</span>
                      ) : e.user?._id === user._id ? (
                        <Button variant="ghost" size="sm" onClick={() => deleteEntry(e._id)} aria-label="Delete entry">
                          <FiTrash2 />
                        </Button>
                      ) : null}
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
