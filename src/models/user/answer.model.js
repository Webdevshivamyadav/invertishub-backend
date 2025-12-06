const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.ObjectId,
    ref:"User",
    required:true,
  },
  questionId:{
    type:mongoose.Schema.ObjectId,
    ref:"Question",
    required:true,
  },
  answer:{
    type:String,
    required:true
  },
},{timestamps:true})

const answerModel = mongoose.model('Answer',answerSchema);
module.exports = answerModel;