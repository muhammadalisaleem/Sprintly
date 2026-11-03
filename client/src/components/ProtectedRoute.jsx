import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// sends you to the login page if nobody is logged in
function ProtectedRoute({ children }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
