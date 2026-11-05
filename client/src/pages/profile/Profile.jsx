import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiExternalLink, FiCheck } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import { useAuth } from '../../context/AuthContext'
import './profile.css'

function Profile() {
  const { user, updateProfile } = useAuth()
  const isFreelancer = user.role === 'freelancer'

  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio || '',
    skills: (user.skills || []).join(', '),
    hourlyRate: user.hourlyRate || '',
  })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSaved(false)
  }

  function handleSubmit(e) {
    e.preventDefault()

    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (isFreelancer && form.hourlyRate !== '' && Number(form.hourlyRate) < 0) {
      errs.hourlyRate = 'Rate cannot be negative'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    updateProfile({
      name: form.name.trim(),
      bio: form.bio.trim(),
      // "React, Node.js" -> ['React', 'Node.js']
      skills: form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      hourlyRate: Number(form.hourlyRate) || 0,
    })
    setSaved(true)
  }

  // first letters of the name, e.g. "Sara Khan" -> "SK"
  const initials = user.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="page">
      <div className="page-header">
        <h2>My Profile</h2>
        <Link to={`/users/${user._id}`}>
          <Button variant="secondary">
            <FiExternalLink /> View public profile
          </Button>
        </Link>
      </div>

      <Card className="profile-form">
        <div className="profile-top">
          <span className="profile-avatar">{initials}</span>
          <div>
            <h3>{user.name}</h3>
            <p className="muted">
              {user.email} · <span className="capitalize">{user.role}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Input label="Full name" name="name" value={form.name} onChange={handleChange} error={errors.name} />
          <Input label="Email" name="email" value={user.email} disabled readOnly />
          <Input
            as="textarea"
            label="Bio"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder={isFreelancer ? 'What do you do and what are you good at?' : 'Tell freelancers about you or your business'}
          />

          {/* skills and rate only make sense for freelancers */}
          {isFreelancer && (
            <div className="form-row">
              <Input
                label="Skills (comma separated)"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="React, Node.js, MongoDB"
              />
              <Input
                label="Hourly rate ($)"
                name="hourlyRate"
                type="number"
                min="0"
                value={form.hourlyRate}
                onChange={handleChange}
                error={errors.hourlyRate}
              />
            </div>
          )}

          <div className="form-actions">
            {saved && (
              <span className="saved-msg">
                <FiCheck /> Saved
              </span>
            )}
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default Profile
