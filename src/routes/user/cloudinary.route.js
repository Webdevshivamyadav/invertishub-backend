const express = require('express')
const { getSignature, getMediaById } = require('../../controllers/user/cloudSignature.controller')
const { authUser } = require('../../middlewares/user.middleware')
const router = express.Router()
const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

router.post('/genrateSignature',authUser, getSignature)
router.get('/media',authUser, getMediaById)

module.exports = router
