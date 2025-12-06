const postModel = require('../../models/user/post.model')
const commentModel = require('../../models/user/comment.model')
const profileModel = require('../../models/user/profile.model')
const userModel = require('../../models/user/user.model')
const commentLikeModel = require('../../models/user/commentLike.model')
const { getMediaById } = require('./cloudSignature.controller')
const addComment = async (req, res) => {
  try {
    const { postId, text: comment } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    if (!postId || !comment) {
      return res.status(400).json({ success: false, message: 'Missing postId or comment' })
    }

    const post = await postModel.findById(postId)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    const newComment = await commentModel.create({
      userId,
      postId,
      comment
    })

    const IncrementCount = await postModel.findOneAndUpdate(
      { _id: postId },
      { $inc: { commentCount: 1 } },
      { new: true }
    )
    return res
      .status(201)
      .json({ success: true, message: 'Comment added successfully', data: newComment })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    if (!commentId) {
      return res.status(400).json({ success: false, message: 'Missing commentId' })
    }

    const comment = await commentModel.findById(commentId)
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' })
    }

    const deleteComment = await commentModel.findByIdAndDelete(commentId)
    const decrementCount = await postModel.findOneAndUpdate(
      { _id: comment.postId },
      { $inc: { commentCount: -1 } },
      { new: true }
    )
    return res
      .status(200)
      .json({ success: true, message: 'Comment deleted successfully', data: deleteComment })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getComments = async (req, res) => {
  try {
    const userId = req.user?.id
    const { postId, page = 0, limit = 10 } = req.body

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    if (!postId) {
      return res.status(400).json({ success: false, message: 'Missing postId' })
    }

    // Convert to numbers + safe pagination
    const pageNum = Number(page)
    const limitNum = Number(limit)
    const skip = pageNum > 0 ? pageNum * limitNum : 0

    // Fetch comments
    const comments = await commentModel
      .find({ postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    if (comments.length === 0) {
      return res.status(200).json({ success: true, data: [] })
    }

    // Collect userIds
    const userIds = comments.map((c) => c.userId)

    // Fetch user + profile in parallel for faster performance
    const [profiles, users] = await Promise.all([
      profileModel
        .find({ profileId: { $in: userIds } })
        .select('profileId profileImageId')
        .lean(),

      userModel
        .find({ _id: { $in: userIds } })
        .select('_id userName')
        .lean()
    ])

    // Convert to maps for fast lookup
    const profileMap = {}
    profiles.forEach((p) => (profileMap[p.profileId] = p))
    const profileImageIds = profiles.map((p) => p.profileImageId)

    const profileImages = await getMediaById(profileImageIds)

    const profileImageMap = {}
    profileImages.forEach((p) => (profileImageMap[p.id] = p.url))

    const userMap = {}
    users.forEach((u) => (userMap[u._id] = u))

    const likedComments = await commentLikeModel
      .find({
        userId,
        commentId: { $in: comments.map((c) => c._id) }
      })
      .lean()

    const likedMap = {}
    likedComments.forEach((lc) => (likedMap[lc.commentId] = true))

    comments.forEach((c) => {
      c.isAlreadyLiked = likedMap[c._id] || false
    })

    // Attach user + profile data to each comment
    const finalComments = comments.map((c) => ({
      ...c,
      user: {
        userName: userMap[c.userId]?.userName || null,
        avatarUrl: profileImageMap[profileMap[c.userId]?.profileImageId] || null
      },
      isAlreadyLiked: likedMap[c._id] || false
    }))

    return res.status(200).json({
      success: true,
      data: finalComments,
      count: finalComments.length
    })
  } catch (error) {
  
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

const toggleLikeComment = async (req, res) => {
  try {
    const { commentId } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    if (!commentId) {
      return res.status(400).json({ success: false, message: 'Missing commentId' })
    }

    const isAlredyLiked = await commentLikeModel.findOne({ userId, commentId })
    if (isAlredyLiked) {
      //unlike
      await commentLikeModel.findByIdAndDelete(isAlredyLiked._id)
      await commentModel.findOneAndUpdate(
        { _id: commentId },
        { $inc: { likesCount: -1 } },
        { new: true }
      )
      return res.status(200).json({ success: true, message: 'Comment unliked successfully' })
    } else {
      //like
      await commentLikeModel.create({ userId, commentId })
      await commentModel.findOneAndUpdate(
        { _id: commentId },
        { $inc: { likesCount: 1 } },
        { new: true }
      )
      return res.status(200).json({ success: true, message: 'Comment liked successfully' })
    }
  } catch (error) {}
}
module.exports = { addComment, deleteComment, getComments, toggleLikeComment }
