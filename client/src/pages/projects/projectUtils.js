import { tasks } from '../../mockData'

// % of the project's tasks that are done
export function getProgress(projectId) {
  const projectTasks = tasks.filter((t) => t.project === projectId)
  if (projectTasks.length === 0) return 0

  const done = projectTasks.filter((t) => t.status === 'done').length
  return Math.round((done / projectTasks.length) * 100)
}
