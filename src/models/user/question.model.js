const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.ObjectId,
    ref:"User",
  },
  questionTitle:{
    type:String,
    default:null,
    required:true
  } ,
  questionDescription:{
    type:String, 
    default:null
  },
  questionTags:{
    type:[String],
    default:null,
  },
  type:{
    type:String,
    default:"question",
  },
  likedCount:{
    type:Number,
    default:0
  },
  dislikedCount:{
    type:Number,
    default:0
  },
},{timestamps:true})

const questionModel = mongoose.model('Question',questionSchema);
module.exports = questionModel;