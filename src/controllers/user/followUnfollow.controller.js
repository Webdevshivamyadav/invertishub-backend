const profileModel = require('../../models/user/profile.model')
const User = require('../../models/user/user.model')
const followUnfollowModel = require('../../models/user/followUnfollow.model')

/**
 * Toggles the follow status between the current user and a target user.
 * If following -> Unfollow.
 * If not following -> Follow.
 */
const toggleFollow = async (req, res) => {
  try {
    const currentUserId = req.user?.id
    // expecting 'targetUserId' from body (renamed from followId/unfollowId for clarity)
    const { targetUserId } = req.body 

    // 1. Basic Validation
    if (!currentUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target User ID is required' })
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' })
    }

    // 2. Check if the Target User actually exists
    const targetUser = await User.findById(targetUserId)
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User to follow not found' })
    }

    // 3. Check existing relationship
    const existingRelationship = await followUnfollowModel.findOne({
      followerId: currentUserId,
      followingId: targetUserId
    })

    // --- LOGIC SPLIT ---

    if (existingRelationship) {
      // ==========================
      // ACTION: UNFOLLOW
      // ==========================
      
      await followUnfollowModel.findByIdAndDelete(existingRelationship._id)

      // Decrement following count for me
      await profileModel.findOneAndUpdate(
        { profileId: currentUserId }, 
        { $inc: { followingCount: -1 } }
      )

      // Decrement follower count for them
      await profileModel.findOneAndUpdate(
        { profileId: targetUserId }, 
        { $inc: { followerCount: -1 } }
      )

      return res.status(200).json({
        success: true,
        message: 'Unfollowed successfully',
        isFollowing: false
      })

    } else {
  
      await followUnfollowModel.create({
        followerId: currentUserId,
        followingId: targetUserId
      })

      // Increment following count for me
      await profileModel.findOneAndUpdate(
        { profileId: currentUserId }, 
        { $inc: { followingCount: 1 } }
      )

      // Increment follower count for them
      await profileModel.findOneAndUpdate(
        { profileId: targetUserId }, 
        { $inc: { followerCount: 1 } }
      )

      return res.status(200).json({
        success: true,
        message: 'Followed successfully',
        isFollowing: true
      })
    }

  } catch (error) {
  
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

module.exports = {
  toggleFollow
}