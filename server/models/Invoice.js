const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  qty: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  // where the line came from, so the same time or milestone is never billed twice
  timeEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeEntry' },
  milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' }
}, { _id: false })

const invoiceSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [itemSchema],
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['unpaid', 'paid', 'overdue'], default: 'unpaid' },
  dueDate: { type: Date, required: true },
  paidAt: Date
}, { timestamps: true })

module.exports = mongoose.model('Invoice', invoiceSchema)
