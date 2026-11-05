import { Link, useParams } from 'react-router-dom'
import { FiUser, FiEdit2 } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import Stars from '../../components/Stars'
import { useAuth } from '../../context/AuthContext'
import { reviews, projects, getUser, getProject } from '../../mockData'
import { formatDate, formatMoney } from '../../utils/format'
import './profile.css'

function PublicProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const person = getUser(id)

  if (!person) {
    return (
      <div className="page">
        <Card>
          <EmptyState icon={<FiUser />} title="User not found" />
        </Card>
      </div>
    )
  }

  const isFreelancer = person.role === 'freelancer'
  const isMe = user._id === person._id

  // reviews other people left for this person, newest first
  const personReviews = reviews
    .filter((r) => r.to === person._id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const average = personReviews.length
    ? personReviews.reduce((sum, r) => sum + r.rating, 0) / personReviews.length
    : 0

  const completedProjects = projects.filter(
    (p) => p.status === 'completed' && (p.freelancer === person._id || p.client === person._id)
  ).length

  const initials = person.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="page">
      <div className="page-header">
        <h2>{isMe ? 'My public profile' : 'Profile'}</h2>
        {isMe && (
          <Link to="/profile">
            <Button variant="secondary">
              <FiEdit2 /> Edit profile
            </Button>
          </Link>
        )}
      </div>

      <div className="public-grid">
        <Card className="public-card">
          <span className="profile-avatar">{initials}</span>
          <h3>{person.name}</h3>
          <p className="muted capitalize">{person.role}</p>

          <div className="public-rating">
            {personReviews.length > 0 ? (
              <>
                <Stars rating={average} />
                <span className="muted">
                  {average.toFixed(1)} ({personReviews.length})
                </span>
              </>
            ) : (
              <span className="muted">No reviews yet</span>
            )}
          </div>

          <div className="public-stats">
            <div>
              <strong>{completedProjects}</strong>
              <span className="muted">Completed projects</span>
            </div>
            {isFreelancer ? (
              <div>
                <strong>{person.hourlyRate ? `${formatMoney(person.hourlyRate)}/h` : '—'}</strong>
                <span className="muted">Hourly rate</span>
              </div>
            ) : (
              <div>
                <strong>{personReviews.length}</strong>
                <span className="muted">Reviews</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="public-section">
            <h4>About</h4>
            <p className={person.bio ? '' : 'muted'}>{person.bio || 'No bio yet.'}</p>
          </div>

          {isFreelancer && (
            <div className="public-section">
              <h4>Skills</h4>
              {person.skills && person.skills.length > 0 ? (
                <div className="skill-tags">
                  {person.skills.map((skill) => (
                    <span key={skill} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="muted">No skills added yet.</p>
              )}
            </div>
          )}

          <div>
            <h4>Reviews</h4>
            {personReviews.length === 0 && <p className="muted">No reviews yet.</p>}
            {personReviews.map((r) => (
              <div key={r._id} className="review">
                <div className="review-top">
                  <strong>{getUser(r.from)?.name}</strong>
                  <Stars rating={r.rating} size={14} />
                </div>
                <p>{r.comment}</p>
                <p className="muted">
                  {getProject(r.project)?.title} · {formatDate(r.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default PublicProfile
