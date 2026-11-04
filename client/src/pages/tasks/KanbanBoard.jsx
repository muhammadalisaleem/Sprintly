// projectId is passed when this is shown as a tab inside ProjectDetail
function KanbanBoard({ projectId }) {
  return (
    <div className={projectId ? '' : 'page'}>
      {projectId ? <h3>Tasks</h3> : <h2>Tasks</h2>}
      <p className="muted">Coming soon</p>
    </div>
  )
}

export default KanbanBoard
