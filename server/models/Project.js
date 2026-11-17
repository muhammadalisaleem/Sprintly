const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  budget: { type: Number, default: 0, min: 0 },
  deadline: Date,
  status: { type: String, enum: ['proposal', 'active', 'completed'], default: 'proposal' }
}, { timestamps: true })

module.exports = mongoose.model('Project', projectSchema)
