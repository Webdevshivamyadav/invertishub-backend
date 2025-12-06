const moongoose = require('mongoose')

const savedItemSchema = new moongoose.Schema({
  userId:{
    type:moongoose.Schema.ObjectId,
    ref:"User",
    required:true,
  },
  itemId:{
    type:moongoose.Schema.ObjectId,
    required:true,
  },
  itemType:{
    type:String,
    enum:["post","answer","question"],
    required:true,
  }
},{timestamps:true})

const savedItemModel = moongoose.model('SavedItem',savedItemSchema);
module.exports = savedItemModel;