const mongoose = require('mongoose');

const dislikedSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.ObjectId,
    ref:"User",
    required:true,
  },
  itemId:{
    type:mongoose.Schema.ObjectId,
    required:true,
  },
  itemType:{
    type:String,
    enum:["post","answer","question"],
    required:true,
  }
},{timestamps:true})

const dislikedModel = mongoose.model('Disliked',dislikedSchema);
module.exports = dislikedModel;