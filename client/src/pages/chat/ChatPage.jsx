import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiPaperclip, FiSend, FiX, FiFile, FiArrowLeft, FiMessageSquare } from 'react-icons/fi'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { messages, getCurrentUser, getUserProjects, getUser, newId } from '../../mockData'
import { formatDate, formatTime } from '../../utils/format'
import './chat.css'

function lastMessage(projectId, list) {
  const projectMessages = list.filter((m) => m.project === projectId)
  return projectMessages[projectMessages.length - 1]
}

function ChatPage() {
  const user = getCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const myProjects = getUserProjects(user._id)

  const [allMessages, setAllMessages] = useState(messages)
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const fileInput = useRef(null)
  const bottomRef = useRef(null)

  // newest conversation first
  const conversations = [...myProjects].sort((a, b) => {
    const la = lastMessage(a._id, allMessages)?.createdAt || ''
    const lb = lastMessage(b._id, allMessages)?.createdAt || ''
    return lb.localeCompare(la)
  })

  const activeId = searchParams.get('project')
  const active = myProjects.find((p) => p._id === activeId)
  const activeMessages = allMessages.filter((m) => m.project === activeId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [activeId, activeMessages.length])

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

  function send(e) {
    e.preventDefault()
    if (!text.trim() && !file) return
    // week 4: upload the file first, then send its URL
    messages.push({
      _id: newId('msg'),
      project: activeId,
      sender: user._id,
      text: text.trim(),
      fileUrl: file ? URL.createObjectURL(file) : '',
      fileName: file ? file.name : '',
      createdAt: new Date().toISOString(),
    })
    setAllMessages([...messages])
    setText('')
    setFile(null)
  }

  if (myProjects.length === 0) {
    return (
      <div className="page">
        <h2>Chat</h2>
        <EmptyState icon={<FiMessageSquare />} title="No conversations yet" message="Each project gets its own chat." />
      </div>
    )
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 16 }}>Chat</h2>

      <div className={`chat ${active ? 'chat-open' : ''}`}>
        <aside className="chat-list">
          {conversations.map((p) => {
            const other = getUser(p.freelancer === user._id ? p.client : p.freelancer)
            const last = lastMessage(p._id, allMessages)
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
                    {other?.name}: {last ? last.text || last.fileName : 'No messages yet'}
                  </div>
                </div>
              </button>
            )
          })}
        </aside>

        <section className="chat-window">
          {!active ? (
            <EmptyState icon={<FiMessageSquare />} title="Pick a conversation" message="Choose a project on the left." />
          ) : (
            <>
              <header className="chat-header">
                <button className="btn btn-ghost btn-sm chat-back" onClick={() => setSearchParams({})} aria-label="Back">
                  <FiArrowLeft />
                </button>
                <div>
                  <strong>{active.title}</strong>
                  <div className="muted">
                    {getUser(active.freelancer)?.name} · {getUser(active.client)?.name}
                  </div>
                </div>
              </header>

              <div className="chat-messages">
                {activeMessages.length === 0 && (
                  <p className="muted" style={{ textAlign: 'center' }}>No messages yet. Say hello!</p>
                )}
                {activeMessages.map((m) => {
                  const mine = m.sender === user._id
                  return (
                    <div key={m._id} className={`bubble-row ${mine ? 'mine' : ''}`}>
                      <div className="bubble">
                        {!mine && <div className="bubble-sender">{getUser(m.sender)?.name}</div>}
                        {m.text && <div>{m.text}</div>}
                        {m.fileName && (
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
                  <Button type="submit" disabled={!text.trim() && !file} aria-label="Send">
                    <FiSend />
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default ChatPage
