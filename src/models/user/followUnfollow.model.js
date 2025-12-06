const mongoose = require('mongoose');

const followUnfollowSchema = new mongoose.Schema({
  followerId:{
    type:mongoose.Schema.ObjectId,
    ref:"User",
    required:true,
  },
  followingId:{
    type:mongoose.Schema.ObjectId,
    ref:"User",
    required:true,
  },
},{timestamps:true})

const followUnfollowModel = mongoose.model('FollowUnfollow',followUnfollowSchema);
module.exports = followUnfollowModel;