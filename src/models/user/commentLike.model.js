const mongoose = require('mongoose');
const commentLikeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
  },
  { timestamps: true }
);
const commentLikeModel = mongoose.model('CommentLike', commentLikeSchema);
module.exports = commentLikeModel;