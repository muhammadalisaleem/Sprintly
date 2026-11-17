const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '', maxlength: 2000 },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' }
}, { timestamps: true })

module.exports = mongoose.model('Message', messageSchema)
