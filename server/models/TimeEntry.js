const mongoose = require('mongoose')

const timeEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  hours: { type: Number, required: true, min: 0.01, max: 24 },
  date: { type: Date, required: true },
  note: { type: String, default: '' },
  invoiced: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('TimeEntry', timeEntrySchema)
