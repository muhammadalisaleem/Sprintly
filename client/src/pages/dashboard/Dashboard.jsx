import { getCurrentUser } from '../../mockData'
import FreelancerDashboard from './FreelancerDashboard'
import ClientDashboard from './ClientDashboard'

function Dashboard() {
  const user = getCurrentUser()
  return user.role === 'client' ? <ClientDashboard user={user} /> : <FreelancerDashboard user={user} />
}

export default Dashboard
