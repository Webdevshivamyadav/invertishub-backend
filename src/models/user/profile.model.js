const mongoose = require('mongoose');

const profileSchema  = new mongoose.Schema({
  profileId :{
    type:mongoose.Schema.ObjectId,
    ref:'User',
  },
  profileImageId:{
    type:String,
    default:null
  },
  userBio:{
    type:String,
    default:null
  },
  phone:{
    type:Number,
    default:0
  },
  followerCount:{
    type:Number,
    default:0,
  },
  followingCount:{
    type:Number,
    default:0
  },
  questionCount:{
    type:Number,
    default:0,
  },
  answerCount:{
    type:Number,
    default:0,
  },
  postCount:{
    type:Number,
    default:0,
  },
},{timestamps:true})

const profileModel = mongoose.model('profile',profileSchema);
module.exports = profileModel;