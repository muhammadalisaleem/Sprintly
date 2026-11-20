const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// only files that are safe to serve back to the browser
// (no .html / .svg / .js, which could run scripts on our site)
const ALLOWED = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.csv', '.fig']

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  // random name so files never overwrite each other or escape the folder
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, Date.now() + '-' + crypto.randomBytes(6).toString('hex') + ext)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED.includes(ext)) cb(null, true)
    else cb(new Error('this file type is not allowed'))
  }
})

module.exports = { upload, UPLOAD_DIR }
