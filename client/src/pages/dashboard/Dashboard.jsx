import { useAuth } from '../../context/AuthContext'
import FreelancerDashboard from './FreelancerDashboard'
import ClientDashboard from './ClientDashboard'

function Dashboard() {
  const { user } = useAuth()
  return user.role === 'client' ? <ClientDashboard user={user} /> : <FreelancerDashboard user={user} />
}

export default Dashboard
