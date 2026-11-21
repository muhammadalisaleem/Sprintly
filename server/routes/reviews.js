const express = require('express')
const Review = require('../models/Review')
const User = require('../models/User')
const auth = require('../middleware/auth')
const { getMemberProject } = require('../utils/access')
const notify = require('../utils/notify')

const router = express.Router()

// reviews left on a project (max 2, one from each side)
router.get('/projects/:id/reviews', auth, async (req, res) => {
  try {
    const project = await getMemberProject(req.params.id, req.user)
    if (!project) return res.status(404).json({ message: 'project not found' })

    const reviews = await Review.find({ project: project._id })
    res.json(reviews)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

// leave a review for the other person on a completed project
router.post('/projects/:id/reviews', auth, async (req, res) => {
  try {
    const project = await getMemberProject(req.params.id, req.user)
    if (!project) return res.status(404).json({ message: 'project not found' })

    if (project.status !== 'completed') {
      return res.status(400).json({ message: 'you can review once the project is complete' })
    }

    const rating = Number(req.body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating should be 1 to 5 stars' })
    }

    const already = await Review.findOne({ project: project._id, from: req.user._id })
    if (already) {
      return res.status(400).json({ message: 'you already reviewed this project' })
    }

    // freelancer reviews the client, client reviews the freelancer
    const to = project.freelancer.equals(req.user._id) ? project.client : project.freelancer

    const review = new Review({
      project: project._id,
      from: req.user._id,
      to,
      rating,
      comment: typeof req.body.comment === 'string' ? req.body.comment.trim() : ''
    })
    await review.save()

    // update their average rating
    const all = await Review.find({ to })
    let sum = 0
    for (let r of all) sum += r.rating
    await User.findByIdAndUpdate(to, { ratingAvg: Math.round((sum / all.length) * 10) / 10 })

    await notify(to, req.user.name + ' left you a ' + rating + ' star review', '/users/' + to)

    res.json(review)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
})

module.exports = router
