const mongoose = require('mongoose')

const proposalSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  scope: { type: String, required: true },
  deliverables: [String],
  amount: { type: Number, required: true, min: 0 },
  timeline: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true })

module.exports = mongoose.model('Proposal', proposalSchema)
