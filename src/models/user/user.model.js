const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    FullName: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    otp:{
      type:String,
    },
    otpExpire:{
      type:Date
    },
    isVerified:{
      type:Boolean,
      default:false,
    },
    tempUser :{
      type:Boolean,
      default:true,
    },
    forgetOtpVerify:{
      type:Boolean,
      default:false
    },
    refershToken: {
      type: String,
      default: null
    },
    refreshTokenExpiry: {
      type: Number,
      default: null
    }
  },
  { timestamps: true }
)

const user = mongoose.model('User', userSchema)
module.exports = user
