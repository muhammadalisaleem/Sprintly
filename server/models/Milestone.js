const mongoose = require('mongoose')

const milestoneSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true, trim: true },
  dueDate: Date,
  amount: { type: Number, default: 0, min: 0 },
  completed: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('Milestone', milestoneSchema)
