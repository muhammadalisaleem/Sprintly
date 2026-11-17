const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

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

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log('server running on port ' + PORT))
