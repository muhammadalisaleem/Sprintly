// projectId is passed when this is shown as a tab inside ProjectDetail
function MilestoneList({ projectId }) {
  return (
    <div className={projectId ? '' : 'page'}>
      {projectId ? <h3>Milestones</h3> : <h2>Milestones</h2>}
      <p className="muted">Coming soon</p>
    </div>
  )
}

export default MilestoneList
