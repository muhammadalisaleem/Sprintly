import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { useAuth } from '../../context/AuthContext'
import './auth.css'

// demo accounts, add them with: node seed.js (in the server folder)
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
  const [loading, setLoading] = useState(false)

  // already logged in, no need to see this page
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'could not connect to server')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <Logo size={36} />
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

          <Button type="submit" full disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <p className="muted auth-switch">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>

        <div className="demo-box">
          <p className="muted">Demo accounts (password 123456):</p>
          {demoAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className="demo-account"
              onClick={() => {
                setEmail(acc.email)
                setPassword('123456')
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
