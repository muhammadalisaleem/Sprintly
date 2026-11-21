import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiPaperclip, FiSend, FiX, FiFile, FiArrowLeft, FiMessageSquare } from 'react-icons/fi'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import Loader from '../../components/Loader'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { getSocket } from '../../utils/socket'
import { formatDate, formatTime } from '../../utils/format'
import './chat.css'

// projectId is passed when this is shown as a tab inside ProjectDetail
function ChatPage({ projectId }) {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [myProjects, setMyProjects] = useState([])
  const [loading, setLoading] = useState(true)
  // last message of every project, for the list on the left
  const [lastMessages, setLastMessages] = useState({})
  const [activeMessages, setActiveMessages] = useState([])

  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef(null)
  const bottomRef = useRef(null)

  const activeId = projectId || searchParams.get('project')
  const active = myProjects.find((p) => p._id === activeId)

  // my projects + the last message of each one
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/projects')
        setMyProjects(res.data)
        if (!projectId) {
          const last = {}
          for (let p of res.data) {
            const m = await api.get('/projects/' + p._id + '/messages')
            if (m.data.length > 0) last[p._id] = m.data[m.data.length - 1]
          }
          setLastMessages(last)
        }
      } catch (err) {
        console.log(err)
      }
      setLoading(false)
    }
    load()
  }, [])

  // open chat: load its messages and join its room for live messages
  useEffect(() => {
    if (!activeId) return
    setActiveMessages([])
    setError('')
    api.get('/projects/' + activeId + '/messages')
      .then((res) => setActiveMessages(res.data))
      .catch(() => setError('could not load messages'))

    const socket = getSocket()
    if (!socket) return
    const join = () => socket.emit('join', activeId)
    join()
    socket.on('connect', join) // join again if the connection dropped

    function onMessage(m) {
      setLastMessages((old) => ({ ...old, [m.project]: m }))
      if (m.project !== activeId) return
      // my own message also comes back here, so skip it if its already there
      setActiveMessages((old) => (old.some((x) => x._id === m._id) ? old : [...old, m]))
    }
    socket.on('message:new', onMessage)

    return () => {
      socket.emit('leave', activeId)
      socket.off('connect', join)
      socket.off('message:new', onMessage)
    }
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [activeId, activeMessages.length])

  if (loading) return <Loader />

  // newest conversation first
  const conversations = [...myProjects].sort((a, b) => {
    const la = lastMessages[a._id]?.createdAt || ''
    const lb = lastMessages[b._id]?.createdAt || ''
    return lb.localeCompare(la)
  })

  function otherPerson(p) {
    return p.freelancer._id === user._id ? p.client : p.freelancer
  }

  function openConversation(id) {
    setSearchParams({ project: id })
    setText('')
    setFile(null)
  }

  function pickFile(e) {
    const picked = e.target.files[0]
    if (picked) setFile(picked)
    e.target.value = ''
  }

  async function send(e) {
    e.preventDefault()
    if (!text.trim() && !file) return

    setSending(true)
    setError('')
    try {
      const data = { text: text.trim() }

      // upload the file first, then send its link in the message
      if (file) {
        const form = new FormData()
        form.append('file', file)
        const up = await api.post('/upload', form)
        data.fileUrl = up.data.fileUrl
        data.fileName = up.data.fileName
      }

      const res = await api.post('/projects/' + activeId + '/messages', data)
      const m = res.data
      setActiveMessages((old) => (old.some((x) => x._id === m._id) ? old : [...old, m]))
      setLastMessages((old) => ({ ...old, [activeId]: m }))
      setText('')
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.message || 'could not send message')
    }
    setSending(false)
  }

  if (myProjects.length === 0) {
    return (
      <div className="page">
        <h2>Chat</h2>
        <EmptyState icon={<FiMessageSquare />} title="No conversations yet" message="Each project gets its own chat." />
      </div>
    )
  }

  const chatWindow = (
    <section className="chat-window">
      {!active ? (
        <EmptyState icon={<FiMessageSquare />} title="Pick a conversation" message="Choose a project on the left." />
      ) : (
        <>
          <header className="chat-header">
            {!projectId && (
              <button className="btn btn-ghost btn-sm chat-back" onClick={() => setSearchParams({})} aria-label="Back">
                <FiArrowLeft />
              </button>
            )}
            <div>
              <strong>{active.title}</strong>
              <div className="muted">
                {active.freelancer.name} · {active.client.name}
              </div>
            </div>
          </header>

          <div className="chat-messages">
            {activeMessages.length === 0 && (
              <p className="muted" style={{ textAlign: 'center' }}>No messages yet. Say hello!</p>
            )}
            {activeMessages.map((m) => {
              const mine = m.sender?._id === user._id
              return (
                <div key={m._id} className={`bubble-row ${mine ? 'mine' : ''}`}>
                  <div className="bubble">
                    {!mine && <div className="bubble-sender">{m.sender?.name}</div>}
                    {m.text && <div>{m.text}</div>}
                    {m.fileUrl && (
                      <a className="bubble-file" href={m.fileUrl} target="_blank" rel="noreferrer" download={m.fileName}>
                        <FiFile /> {m.fileName}
                      </a>
                    )}
                    <div className="bubble-time">
                      {formatDate(m.createdAt)} · {formatTime(m.createdAt)}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          <form className="chat-input" onSubmit={send}>
            {error && <p className="form-error">{error}</p>}
            {file && (
              <div className="chat-file-chip">
                <FiFile /> <span>{file.name}</span>
                <button type="button" onClick={() => setFile(null)} aria-label="Remove file"><FiX /></button>
              </div>
            )}
            <div className="chat-input-row">
              <input type="file" ref={fileInput} onChange={pickFile} hidden />
              <Button variant="ghost" onClick={() => fileInput.current.click()} aria-label="Attach file">
                <FiPaperclip />
              </Button>
              <input
                className="input"
                placeholder="Type a message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Message"
              />
              <Button type="submit" disabled={sending || (!text.trim() && !file)} aria-label="Send">
                <FiSend />
              </Button>
            </div>
          </form>
        </>
      )}
    </section>
  )

  // inside a project page: just the chat, no list
  if (projectId) {
    return <div className="chat chat-single chat-open">{chatWindow}</div>
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 16 }}>Chat</h2>

      <div className={`chat ${active ? 'chat-open' : ''}`}>
        <aside className="chat-list">
          {conversations.map((p) => {
            const other = otherPerson(p)
            const last = lastMessages[p._id]
            return (
              <button
                key={p._id}
                className={`chat-list-item ${p._id === activeId ? 'active' : ''}`}
                onClick={() => openConversation(p._id)}
              >
                <div className="chat-avatar">{other?.name[0]}</div>
                <div className="chat-list-text">
                  <div className="chat-list-top">
                    <strong>{p.title}</strong>
                    {last && <span className="muted">{formatDate(last.createdAt).replace(/, \d{4}$/, '')}</span>}
                  </div>
                  <div className="muted chat-preview">
                    {last ? `${last.sender?.name}: ${last.text || last.fileName}` : 'No messages yet'}
                  </div>
                </div>
              </button>
            )
          })}
        </aside>

        {chatWindow}
      </div>
    </div>
  )
}

export default ChatPage
