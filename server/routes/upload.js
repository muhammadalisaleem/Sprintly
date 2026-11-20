const express = require('express')
const multer = require('multer')
const auth = require('../middleware/auth')
const { upload } = require('../middleware/upload')

const router = express.Router()

// upload one file (form field "file"), returns the link to put in a chat message
router.post('/upload', auth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'file is too big (10 MB max)' : err.message
      return res.status(400).json({ message })
    }
    if (err) {
      return res.status(400).json({ message: err.message })
    }
    if (!req.file) {
      return res.status(400).json({ message: 'please choose a file' })
    }

    res.status(201).json({
      fileUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
      fileName: req.file.originalname.slice(0, 200)
    })
  })
})

module.exports = router
