import { FaStar, FaRegStar } from 'react-icons/fa'

// shows a rating like 4 out of 5 as yellow stars
function Stars({ rating, size = 16 }) {
  const rounded = Math.round(rating)

  return (
    <span
      aria-label={`${rating} out of 5 stars`}
      style={{ display: 'inline-flex', gap: 2, color: '#f59e0b', verticalAlign: 'middle' }}
    >
      {[1, 2, 3, 4, 5].map((n) => (n <= rounded ? <FaStar key={n} size={size} /> : <FaRegStar key={n} size={size} />))}
    </span>
  )
}

export default Stars
