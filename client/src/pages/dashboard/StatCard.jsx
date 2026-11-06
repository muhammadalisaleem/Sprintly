function StatCard({ icon, label, value, colour = 'purple' }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon badge-${colour}`}>{icon}</div>
      <div>
        <div className="muted">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  )
}

export default StatCard
