const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.ObjectId,
    ref:"User",
    required:true,
  },
  postId:{
    type:mongoose.Schema.ObjectId,
    ref:"Post",
    required:true,
  },
  comment:{
    type:String,
    required:true
  },
  likesCount:{
    type:Number,
    default:0
  }
},{timestamps:true})

const commentModel = mongoose.model('Comment',commentSchema);
module.exports = commentModel;