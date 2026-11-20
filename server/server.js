const http = require('http')
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()
const { initSocket } = require('./socket')

const app = express()

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('mongodb connected'))
  .catch((err) => console.log(err))

app.get('/', (req, res) => {
  res.send('api is running')
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/projects', require('./routes/projects'))
app.use('/api/proposals', require('./routes/proposals'))
app.use('/api', require('./routes/time'))
app.use('/api', require('./routes/invoices'))
app.use('/api', require('./routes/messages'))
app.use('/api', require('./routes/upload'))
app.use('/api', require('./routes/dashboard'))
app.use('/api', require('./routes/notifications'))

// uploaded chat files; nosniff stops the browser treating them as pages
app.use('/uploads', express.static(require('./middleware/upload').UPLOAD_DIR, {
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
}))

// one http server for the api and socket.io (chat + live notifications)
const server = http.createServer(app)
initSocket(server)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log('server running on port ' + PORT))
