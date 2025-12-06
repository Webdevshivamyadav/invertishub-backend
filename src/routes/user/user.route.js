const express = require('express')
const {
  registerUser,
  verifiedUser,
  loginUser,
  forgetPassword,
  verifyForgetOtp,
  updateNewPassword,
  logout,
  updateProfile,
  RefreshToken
} = require('../../controllers/user/user.controller')
const { validation } = require('../../middlewares/validation')
const { registerValidation } = require('../../validators/user.validator')
const { findUserName } = require('../../controllers/user/username.controller')
const { getUserProfile } = require('../../controllers/user/profile.controller')
const { authUser } = require('../../middlewares/user.middleware')
const { genrateRefreshToken } = require('../../utils/genrateToken')
const router = express.Router()

router.post('/register', registerValidation, validation, registerUser)
router.post('/verified-user', verifiedUser)
router.post('/login', loginUser)
router.post('/forget-password', forgetPassword)
router.post('/verify-forget-otp', verifyForgetOtp)
router.post('/update-new-password', updateNewPassword)
router.post('/logout',authUser, logout)
router.post('/check-username', findUserName)
router.post ('/update-user-profile',authUser,updateProfile)
router.post('/get-user-profile',authUser, getUserProfile)
router.post('/genrate-access-token', RefreshToken)

module.exports = router
