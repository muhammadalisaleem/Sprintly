// colour for every status used in the app
const colours = {
  // project
  proposal: 'purple',
  active: 'blue',
  completed: 'green',
  // proposal
  pending: 'yellow',
  accepted: 'green',
  rejected: 'red',
  // task
  todo: 'gray',
  doing: 'blue',
  done: 'green',
  // invoice
  unpaid: 'yellow',
  paid: 'green',
  overdue: 'red',
  // priority
  low: 'gray',
  medium: 'yellow',
  high: 'red',
}

const labels = {
  todo: 'to do',
  doing: 'in progress',
}

function StatusBadge({ status }) {
  const colour = colours[status] || 'gray'
  return <span className={`badge badge-${colour}`}>{labels[status] || status}</span>
}

export default StatusBadge
