const profileModel = require('../../models/user/profile.model')
const User = require('../../models/user/user.model')
const { sendMail } = require('../../services/email.services')
const { genrateOtp } = require('../../utils/genrateOtp')
const { genrateRefreshToken, genrateAcessToken } = require('../../utils/genrateToken')
const { hashPasswrod, verifyPassword } = require('../../utils/hashPassword')
const { finalUploadTheFile, moveAssetDynamic, getMediaById } = require('./cloudSignature.controller')
const jwt = require('jsonwebtoken')

const registerUser = async (req, res) => {
  const { fullName: FullName, email, password } = req.body.user
  const { username: userName } = req.body

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
       
      if(!existingUser.isVerified){
       const newOtp = genrateOtp()
        existingUser.otp = newOtp
        existingUser.otpExpire = new Date(Date.now() + 5 * 60 * 1000)
        await existingUser.save()

        await sendMail(email, newOtp)

        return res.status(200).json({
          message: "You already registered but didn't verify OTP. New OTP sent.",
          success: true
        })
      }

      return res.status(409).json({
        message: 'User already exists',
        success: false
      })
    }

    // Hash password
    const hashedPassword = await hashPasswrod(password)

    // Generate OTP
    const otp = genrateOtp()

    // Set OTP expiration time (5 minutes)
    const otpExpire = new Date(Date.now() + 5 * 60 * 1000)

    // Send OTP email
    const mailInfo = await sendMail(email, otp)
   
    // Create new user
    const newUser = await User.create({
      FullName,
      userName,
      email,
      password: hashedPassword,
      otp,
      otpExpire
    })
    const createUserProfile = await profileModel.create({
      profileId: newUser._id
    })
   
    // Success response
    return res.status(201).json({
      message: 'Please verify your email using the OTP sent.',
      success: true,
    })
  } catch (error) {
    
    return res.status(500).json({
      message: 'Something went wrong!',
      success: false,
      error: error.message
    })
  }
}

const verifiedUser = async (req, res) => {
  const { email, otp } = req.body
  
  try {
    //checking user is valid
    const validateUser = await User.findOne({ email })
    if (!validateUser) {
      return res.status(404).json({
        message: 'user not found',
        success: false
      })
    }

    // checking otp is expire or not

    if (validateUser.otpExpire < new Date()) {
      await User.deleteOne({ email })
      return res.status(400).json({
        message: 'OTP expired, please register again',
        success: false
      })
    }

    // verifiy otp is valid or not
    if (validateUser.otp !== otp.join('')) {
      return res.status(400).json({
        message: 'Invalid Otp',
        success: false
      })
    }

    validateUser.isVerified = true
    validateUser.tempUser = false
    validateUser.otp = null
    validateUser.otpExpire = null

    await validateUser.save()

     // Generate JWT token
    // const token = genrateToken({ id: validateUser._id, email: validateUser.email })

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    
    return res.status(201).json({
      message: 'Account created successfully',
      success: true,
        user: {
        FullName: validateUser.FullName,
        userName: validateUser.userName,
        email: validateUser.email
      }
    })
  
  } catch (error) {
    return res.status(500).json({
      message: 'Inernal server Error',
      success: false
    })
  }
}

const resendOtp = async (req, res) => {
  const { email } = req.body

  try {
    // check user valid or not
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        message: 'user not found',
        success: false
      })
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: 'user alredy verified Please try login .',
        success: false
      })
    }

    const otp = genrateOtp()
    const otpExpire = new Date(Date.now + 5 * 60 * 1000)

    // update user new otp , otpExpire

    user.otp = otp
    user.otpExpire = otpExpire
    await user.save()
    await sendMail(email, otp)

    // sending response
    return res.status(200).json({
      message: 'New OTP has been sent to your email. It will expire in 5 minutes.',
      success: true
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Inernal server Error',
      success: false
    })
  }
}

const loginUser = async (req, res) => {
 
  const { email, password } = req.body
  try {
    const exsitingUser = await User.findOne({ email })
    if (!exsitingUser) {
      return res.status(404).json({
        message: 'Invalild Email or password',
        success: false
      })
    }

    if (!exsitingUser.isVerified) {
      return res.status(400).json({
        message: 'Please verified your account',
        success: false
      })
    }

    const verifiedPassword = await verifyPassword(password, exsitingUser.password)

    if (!verifiedPassword) {
      return res.status(400).json({
        message: 'Invalid Email or password ',
        success: false
      })
    }
    
    
   

    const acesstoken = genrateAcessToken({ id: exsitingUser._id, email: exsitingUser.email })
    const refreshtoken = genrateRefreshToken({ id: exsitingUser._id, email: exsitingUser.email }) 
    exsitingUser.refershToken = refreshtoken;
    exsitingUser.refreshTokenExpiry = Date.now() + 60 * 60 ;
    await exsitingUser.save()
   
      res.cookie("refresh-token", refreshtoken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 1000,
      domain: "invertishub.vercel.app" 
    });
    
    const profile = await profileModel.findOne({ profileId: exsitingUser._id });
    const profileImage = await getMediaById(profile.profileImageId);
    if(profileImage){
        return res.status(200).json({
        message: 'login sucessfully ',
        accessToken:acesstoken,
        success: true,
        user:{
        id:exsitingUser._id,
        FullName: exsitingUser.FullName,
        userName: exsitingUser.userName,
        email: exsitingUser.email,
        profileImage:profileImage.url
      }
    })
    }
    return res.status(200).json({
      message: 'login sucessfully ',
      success: true,
      accessToken:acesstoken,
      user:{
        FullName: exsitingUser.FullName,
        userName: exsitingUser.userName,
        email: exsitingUser.email,
        profileImage:""
      }
    })
  } catch (error) {
   
    return res.status(500).json({
      message: 'something went wrong !',
      success: false
    })
  }
}

const forgetPassword = async (req, res) => {
  const { email } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        message: 'Invalid User',
        success: false
      })
    }

    if (!user.isVerified) {
      return res.status(404).json({
        message: 'Invalid User',
        success: false
      })
    }

    const otp = genrateOtp()
    const otpExpire = new Date(Date.now() + 5 * 60 * 1000)
    await sendMail(email, otp)
    user.otp = otp
    user.otpExpire = otpExpire
    await user.save()

    return res.status(200).json({
      message: 'A verification otp send to mail',
      success: false,
      user: {
        email: user.email
      }
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error',
      success: false
    })
  }
}

const verifyForgetOtp = async (req, res) => {
  const { email, otp } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        message: 'user not found '
      })
    }

    if (user.otpExpire < new Date()) {
      return res.status(400).json({
        message: 'Expired otp',
        success: false
      })
    }

    if (user.otp !== otp.join('')) {
      return res.status(400).json({
        message: 'Invalid otp',
        success: false
      })
    }
    user.otp = null
    user.otpExpire = null
    user.forgetOtpVerify = true
    await user.save()

    return res.status(200).json({
      message: 'otp verifed',
      success: true
    })
  } catch (error) {
    return res.status(200).json({
      message: 'Internal server error',
      success: false
    })
  }
}

const updateNewPassword = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        message: 'user not found',
        success: false
      })
    }
    if (!user.forgetOtpVerify) {
      return res.status(404).json({
        message: 'Please verifed your otp',
        success: false
      })
    }
    const HashedPassword = await hashPasswrod(password)
    user.password = HashedPassword
    user.forgetOtpVerify = false
    await user.save()
    return res.status(200).json({
      message: 'password change successfully',
      success: true
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Inernal server error',
      success: false
    })
  }
}

const updateProfile = async (req, res) => {
  const id = req.user?.id
  const { bio: userBio, phone, username, fullName } = req.body.data
  const { publicId: profileImageId } = req.body

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user'
    })
  }

  try {
    const user = await User.findById(id)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not exist'
      })
    }

    // 🔹 update user basic info
    await User.findByIdAndUpdate(user._id, {
      userName: username,
      FullName: fullName
    })

    // 🔹 update profile main data FIRST (and get new document)
    const updatedProfile = await profileModel.findOneAndUpdate(
      { profileId: user._id },
      {
        profileImageId: profileImageId,
        userBio: userBio,
        phone: phone
      },
      { new: true } // <-- IMPORTANT
    )

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      })
    }
    await moveAssetDynamic(updatedProfile.profileImageId, 'InvertishubUserProfile')
    // 🔹 move file after DB update (SAFE FLOW)
    const finalUpload = await finalUploadTheFile(
      updatedProfile.profileImageId,
      'InvertishubUserProfile'
    )

    if (finalUpload?.error) {
      return res.status(500).json({
        success: false,
        message: 'Image move failed',
        cloudinaryError: finalUpload.error
      })
    }
  
    // 🔹 update final storage path
     const profileUpdate = await profileModel.findOneAndUpdate(
      { profileId: user._id },
      {
        profileImageId: finalUpload.public_id
      }
    )
  
    return res.status(200).json({
      success: true,
      message: 'Profile updated'
    })
  } catch (error) {
   
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

const logout = (req, res) => {
  res.clearCookie('refresh-token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // only secure in production
    sameSite: 'strict'
  })

  res.status(200).json({ message: 'Logged out successfully' })
}

const RefreshToken = async (req, res ) =>{
 
  const { token:refreshToken } = req.cookies
  
  if(!refreshToken){
    return res.status(400).json({
      message: 'Token not found',
      success: false
    })
  }

  try{
     const decode = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) ;
    
     const user = await User.findOne({ refershToken: refreshToken })

     if(!user){
      return res.status(400).json({
        message: 'token not found',
        success: false
      })
    }

      const accessToken = genrateAcessToken({ id: user._id, email: user.email })
      return res.status(200).json({
        message: 'Token refresh successfully',
        success: true,
        accessToken
      })
   
  }catch(error){

  
    if (error.name === 'TokenExpiredError') {
      res.clearCookie('refresh-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // only secure in production
        sameSite: 'strict'
      })
      return res.status(400).json({ message: 'Token expired. Please log in again.', expired:true })
    }
  
    return res.status(500).json({
      message: 'Internal server error',
      success: false
    })
  }
  
}
module.exports = {
  registerUser,
  verifiedUser,
  resendOtp,
  loginUser,
  forgetPassword,
  verifyForgetOtp,
  updateNewPassword,
  logout,
  updateProfile,
  RefreshToken,
}
