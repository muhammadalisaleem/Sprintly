import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { FiZap } from 'react-icons/fi'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { useAuth } from '../../context/AuthContext'
import './auth.css'

// accounts from mockData you can log in with (any password)
const demoAccounts = [
  { email: 'sara@sprintly.dev', role: 'freelancer' },
  { email: 'hamza@acme.com', role: 'client' },
]

function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // already logged in, no need to see this page
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    if (login(email)) {
      navigate('/dashboard')
    } else {
      setError('No account found with this email')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <FiZap /> Sprintly
        </div>
        <h2>Welcome back</h2>
        <p className="muted">Log in to manage your projects</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="form-error auth-error">{error}</p>}

          <Button type="submit" full>
            Log in
          </Button>
        </form>

        <p className="muted auth-switch">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>

        <div className="demo-box">
          <p className="muted">Demo accounts (any password):</p>
          {demoAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className="demo-account"
              onClick={() => {
                setEmail(acc.email)
                setPassword('demo')
                setError('')
              }}
            >
              {acc.email} <span className="muted">({acc.role})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Login
