const likeModel = require('../../models/user/like.model')
const dislikedModel = require('../../models/user/disliked.model')
const questionModel = require('../../models/user/question.model')
const postModel = require('../../models/user/post.model')

// 1. Configuration Maps
const TARGET_MODEL_MAP = {
  post: postModel,
  question: questionModel
}

const INTERACTION_CONFIG = {
  like: {
    model: likeModel,
    counterField: 'likedCount',
    messages: {
      added: 'Liked successfully',
      removed: 'Unliked successfully'
    }
  },
  dislike: {
    model: dislikedModel,
    counterField: 'dislikedCount',
    messages: {
      added: 'Disliked successfully',
      removed: 'Undisliked successfully'
    }
  }
}

/**
 * Generic Toggle Function
 * Handles both Likes and Dislikes based on the 'action' parameter
 */
const toggleInteraction = async (req, res) => {
  try {
    const userId = req.user?.id
    const { itemId, itemType, action } = req.body

    // 1. Input Validation
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    if (!itemId || !itemType || !action) {
      return res.status(400).json({ success: false, message: 'Missing parameters' })
    }

    // 2. Get Target Model
    const TargetModel = TARGET_MODEL_MAP[itemType]
    if (!TargetModel) {
      return res.status(400).json({ success: false, message: 'Invalid item type' })
    }

    // 3. Get Config
    const config = INTERACTION_CONFIG[action]
    const InteractionModel = config.model

    // 4. Verify the Post/Question Exists
    const targetItem = await TargetModel.findById(itemId)
    if (!targetItem) {
      return res.status(404).json({ success: false, message: `${itemType} not found` })
    }

    // 5. Check if Already Liked/Disliked (Same action)
    const existingInteraction = await InteractionModel.findOne({ userId, itemId, itemType })

    // --- REMOVE (TOGGLE OFF) ---
    if (existingInteraction) {
      await InteractionModel.findByIdAndDelete(existingInteraction._id)

      await TargetModel.findByIdAndUpdate(itemId, {
        $inc: { [config.counterField]: -1 }
      })

      return res.status(200).json({
        success: true,
        message: config.messages.removed,
        active: false
      })
    }

    // ⭐⭐⭐ CROSS TOGGLE: LIKE → DISLIKE or DISLIKE → LIKE ⭐⭐⭐
    const oppositeAction = action === 'like' ? 'dislike' : 'like'
    const oppositeConfig = INTERACTION_CONFIG[oppositeAction]
    const OppositeModel = oppositeConfig.model

    const oppositeInteraction = await OppositeModel.findOne({ userId, itemId, itemType })

    if (oppositeInteraction) {
      await OppositeModel.findByIdAndDelete(oppositeInteraction._id)

      await TargetModel.findByIdAndUpdate(itemId, {
        $inc: { [oppositeConfig.counterField]: -1 }
      })
    }

    // --- ADD NEW LIKE/DISLIKE ---
    await InteractionModel.create({ userId, itemId, itemType })

    await TargetModel.findByIdAndUpdate(itemId, {
      $inc: { [config.counterField]: 1 }
    })

    return res.status(201).json({
      success: true,
      message: config.messages.added,
      active: true
    })
  } catch (error) {
 
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// EXPORT
module.exports = { toggleInteraction }
