import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiCheck, FiX, FiPrinter, FiFileText, FiSend } from 'react-icons/fi'
import Button from '../../components/Button'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { proposals, getProject, getUser } from '../../mockData'
import { formatDate, formatMoney } from '../../utils/format'
import { addNotification } from '../../utils/notifications'
import './proposals.css'

function ProposalView() {
  const { id } = useParams()
  const { user } = useAuth()

  // mockData is changed directly, this just tells React to draw again
  const [, setVersion] = useState(0)

  const proposal = proposals.find((p) => p._id === id)
  const project = proposal && getProject(proposal.project)
  const isMember = project && (project.freelancer === user._id || project.client === user._id)

  if (!isMember) {
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

  const freelancer = getUser(project.freelancer)
  const client = getUser(project.client)
  const isClient = user._id === project.client

  // week 3: these become PATCH /api/proposals/:id/accept and /reject
  function accept() {
    proposal.status = 'accepted'
    proposal.respondedAt = new Date().toISOString()
    project.status = 'active'
    project.budget = proposal.amount
    addNotification(freelancer._id, `${client.name} accepted your proposal for ${project.title}`, `/proposals/${proposal._id}`)
    setVersion((v) => v + 1)
  }

  function reject() {
    if (!window.confirm('Reject this proposal?')) return
    proposal.status = 'rejected'
    proposal.respondedAt = new Date().toISOString()
    addNotification(freelancer._id, `${client.name} rejected your proposal for ${project.title}`, `/proposals/${proposal._id}`)
    setVersion((v) => v + 1)
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
              {proposal.respondedAt && ` on ${formatDate(proposal.respondedAt)}`}. Both parties agree to the scope,
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
