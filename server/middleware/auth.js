const jwt = require('jsonwebtoken')
const User = require('../models/User')

// use this on routes that need login
const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ message: 'no token, please login' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
    if (!req.user) {
      return res.status(401).json({ message: 'user not found' })
    }
    next()
  } catch (err) {
    res.status(401).json({ message: 'token is not valid' })
  }
}

module.exports = auth
