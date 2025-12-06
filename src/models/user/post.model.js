const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.ObjectId,
    ref:"User",
    required:true,
  },
  postUrl:{
    type:String,
    required:true,
  },
  caption:{
    type:String,
    required:true,
  },
  type:{
    type:String,
    default:"post",
  },
  likedCount:{
    type:Number,
    default:0
  },
  dislikedCount:{
    type:Number,
    default:0
  },
  commentCount:{
    type:Number,
    default:0
  }
},{timestamps:true})

const postModel = mongoose.model('post',postSchema);
module.exports = postModel;