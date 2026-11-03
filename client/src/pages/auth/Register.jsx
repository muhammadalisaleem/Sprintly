import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { FiZap, FiBriefcase, FiUser } from 'react-icons/fi'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { useAuth } from '../../context/AuthContext'
import './auth.css'

const roles = [
  { value: 'freelancer', label: 'Freelancer', text: 'I work on projects', icon: <FiBriefcase /> },
  { value: 'client', label: 'Client', text: 'I hire freelancers', icon: <FiUser /> },
]

function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'freelancer',
  })
  const [errors, setErrors] = useState({})

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!form.email.includes('@')) errs.email = 'Enter a valid email'
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()

    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    if (register(form)) {
      navigate('/dashboard')
    } else {
      setErrors({ email: 'An account with this email already exists' })
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <FiZap /> Sprintly
        </div>
        <h2>Create an account</h2>
        <p className="muted">Start managing your projects in minutes</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <p className="role-title">I am a...</p>
          <div className="role-picker">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                className={form.role === r.value ? 'role-option selected' : 'role-option'}
                onClick={() => setForm({ ...form, role: r.value })}
              >
                <span className="role-icon">{r.icon}</span>
                <strong>{r.label}</strong>
                <span className="muted">{r.text}</span>
              </button>
            ))}
          </div>

          <Input label="Full name" name="name" value={form.name} onChange={handleChange} error={errors.name} />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <Input
            label="Confirm password"
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={handleChange}
            error={errors.confirm}
          />

          <Button type="submit" full>
            Sign up
          </Button>
        </form>

        <p className="muted auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
