const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
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
  reason:{
    type:String,
    required:true
  },
},{timestamps:true})

const reportModel = mongoose.model('Report',reportSchema);
module.exports = reportModel;