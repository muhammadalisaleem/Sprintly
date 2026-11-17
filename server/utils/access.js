const mongoose = require('mongoose')
const Project = require('../models/Project')

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

// returns the project only if the user is its freelancer or client
// (so nobody can see another person's project, even by guessing the id)
async function getMemberProject(projectId, user) {
  if (!isValidId(projectId)) return null
  const project = await Project.findById(projectId)
  if (!project) return null
  const isMember = project.freelancer.equals(user._id) || project.client.equals(user._id)
  return isMember ? project : null
}

module.exports = { isValidId, getMemberProject }
