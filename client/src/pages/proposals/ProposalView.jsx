import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiCheck, FiX, FiPrinter, FiFileText, FiSend } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Loader from '../../components/Loader'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { formatDate, formatMoney } from '../../utils/format'
import './proposals.css'

function ProposalView() {
  const { id } = useParams()
  const { user } = useAuth()

  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(true)

  // the server only sends it to the freelancer or the client of the project
  useEffect(() => {
    api.get('/proposals/' + id)
      .then((res) => setProposal(res.data))
      .catch(() => setProposal(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loader />

  if (!proposal) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            icon={<FiFileText />}
            title="Proposal not found"
            action={
              <Link to="/projects">
                <Button variant="secondary">Back to projects</Button>
              </Link>
            }
          />
        </Card>
      </div>
    )
  }

  const project = proposal.project
  const freelancer = project.freelancer
  const client = project.client
  const isClient = user._id === client._id

  async function accept() {
    try {
      const res = await api.put('/proposals/' + id + '/accept')
      setProposal({ ...proposal, status: res.data.status, updatedAt: res.data.updatedAt })
    } catch (err) {
      alert(err.response?.data?.message || 'something went wrong')
    }
  }

  async function reject() {
    if (!window.confirm('Reject this proposal?')) return
    try {
      const res = await api.put('/proposals/' + id + '/reject')
      setProposal({ ...proposal, status: res.data.status, updatedAt: res.data.updatedAt })
    } catch (err) {
      alert(err.response?.data?.message || 'something went wrong')
    }
  }

  return (
    <div className="page">
      <div className="page-header no-print">
        <Link to={`/projects/${project._id}`} className="back-link">
          <FiArrowLeft /> {project.title}
        </Link>
        {proposal.status === 'accepted' && (
          <Button variant="secondary" onClick={() => window.print()}>
            <FiPrinter /> Print contract
          </Button>
        )}
      </div>

      <Card className="proposal-paper">
        <div className="proposal-head">
          <div>
            <p className="muted">Proposal for</p>
            <h2>{project.title}</h2>
            <p className="muted">Sent {formatDate(proposal.createdAt)}</p>
          </div>
          <StatusBadge status={proposal.status} />
        </div>

        <div className="proposal-parties">
          <div>
            <span className="muted">From (freelancer)</span>
            <strong>{freelancer.name}</strong>
            <span className="muted">{freelancer.email}</span>
          </div>
          <div>
            <span className="muted">To (client)</span>
            <strong>{client.name}</strong>
            <span className="muted">{client.email}</span>
          </div>
        </div>

        <div className="proposal-section">
          <h4>Scope of work</h4>
          <p>{proposal.scope}</p>
        </div>

        <div className="proposal-section">
          <h4>Deliverables</h4>
          <ul>
            {proposal.deliverables.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>

        <div className="proposal-numbers">
          <div>
            <span className="muted">Amount</span>
            <strong>{formatMoney(proposal.amount)}</strong>
          </div>
          <div>
            <span className="muted">Timeline</span>
            <strong>{proposal.timeline}</strong>
          </div>
        </div>

        {/* client decides on a pending proposal */}
        {isClient && proposal.status === 'pending' && (
          <div className="proposal-actions no-print">
            <Button variant="danger" onClick={reject}>
              <FiX /> Reject
            </Button>
            <Button variant="success" onClick={accept}>
              <FiCheck /> Accept proposal
            </Button>
          </div>
        )}

        {!isClient && proposal.status === 'pending' && (
          <p className="muted proposal-actions no-print">Waiting for {client.name} to respond.</p>
        )}

        {/* freelancer can try again after a rejection */}
        {!isClient && proposal.status === 'rejected' && (
          <div className="proposal-actions no-print">
            <Link to={`/projects/${project._id}/proposal/new`}>
              <Button>
                <FiSend /> Send a new proposal
              </Button>
            </Link>
          </div>
        )}

        {/* the accepted proposal is the contract between both people */}
        {proposal.status === 'accepted' && (
          <div className="contract">
            <h4>Agreement</h4>
            <p>
              {client.name} accepted this proposal
              {` on ${formatDate(proposal.updatedAt)}`}. Both parties agree to the scope,
              deliverables, amount and timeline above.
            </p>
            <div className="signatures">
              <div>
                <strong>{freelancer.name}</strong>
                <span className="muted">Freelancer</span>
              </div>
              <div>
                <strong>{client.name}</strong>
                <span className="muted">Client</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default ProposalView
