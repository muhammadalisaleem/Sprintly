import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FaStar, FaRegStar } from 'react-icons/fa'
import { FiArrowLeft, FiStar } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Input from '../../components/Input'
import EmptyState from '../../components/EmptyState'
import { useAuth } from '../../context/AuthContext'
import Loader from '../../components/Loader'
import api from '../../api'
import './reviews.css'

const ratingWords = ['', 'Poor', 'Okay', 'Good', 'Very good', 'Excellent']

function ReviewForm() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const p = await api.get('/projects/' + id)
        setProject(p.data)
        const r = await api.get('/projects/' + id + '/reviews')
        setAlreadyReviewed(r.data.some((rev) => rev.from === user._id))
      } catch (err) {
        console.log(err)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <Loader />

  // server only sends the project if im in it
  const isMember = Boolean(project)

  // you can only review a completed project you were part of, once
  let problem = ''
  if (!isMember) problem = 'Project not found'
  else if (project.status !== 'completed') problem = 'You can review once the project is complete'
  else if (alreadyReviewed) problem = 'You already reviewed this project'

  if (problem) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            icon={<FiStar />}
            title={problem}
            action={
              <Link to={isMember ? `/projects/${id}` : '/projects'}>
                <Button variant="secondary">Back to project</Button>
              </Link>
            }
          />
        </Card>
      </div>
    )
  }

  // freelancer reviews the client and the client reviews the freelancer
  const other = user._id === project.freelancer._id ? project.client : project.freelancer

  async function handleSubmit(e) {
    e.preventDefault()

    if (rating === 0) {
      setError('Please pick a star rating')
      return
    }

    setSaving(true)
    try {
      await api.post('/projects/' + id + '/reviews', { rating, comment: comment.trim() })
      navigate(`/users/${other._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'could not send review')
      setSaving(false)
    }
  }

  // while hovering show the hovered stars, otherwise the picked ones
  const shown = hover || rating

  return (
    <div className="page">
      <Link to={`/projects/${id}`} className="back-link">
        <FiArrowLeft /> {project.title}
      </Link>

      <Card className="review-form">
        <h2>Review {other.name}</h2>
        <p className="muted">How was working with them on {project.title}?</p>

        <form onSubmit={handleSubmit}>
          <div className="star-picker" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => {
                  setRating(n)
                  setError('')
                }}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                {n <= shown ? <FaStar /> : <FaRegStar />}
              </button>
            ))}
            <span className="star-word">{ratingWords[shown]}</span>
          </div>
          {error && <p className="form-error star-error">{error}</p>}

          <Input
            as="textarea"
            label="Comment (optional)"
            name="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What went well? What could be better?"
          />

          <div className="form-actions">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>{saving ? 'Sending...' : 'Submit review'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ReviewForm
