const User = require('../../models/user/user.model')
const Post = require('../../models/user/post.model')
const profileModel = require('../../models/user/profile.model')
const likeModel = require('../../models/user/like.model')
const dislikedModel = require('../../models/user/disliked.model')
const savedItemModel = require('../../models/user/savedItem.model')
const followModel = require('../../models/user/followUnfollow.model')
const {
  moveAssetDynamic,
  finalUploadTheFile,
  getMediaById
} = require('./cloudSignature.controller')

const questionModel = require('../../models/user/question.model')
const { forgetPassword } = require('./user.controller')
const followUnfollowModel = require('../../models/user/followUnfollow.model')

const modelMapping = {
  post: Post,
  question: questionModel
}
// ------------------------------------------
// CREATE POST
// ------------------------------------------

const createPost = async (req, res) => {
  const { caption, publicId: postUrl } = req.body
  const id = req.user?.id

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user'
    })
  }

  if (!postUrl) {
    return res.status(400).json({
      success: false,
      message: 'Post image is required'
    })
  }

  try {
    const user = await User.findById(id)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not exist'
      })
    }

    await moveAssetDynamic(postUrl, 'posts')
    const uploaded = await finalUploadTheFile(postUrl, 'posts')

    const post = await Post.create({
      userId: user._id,
      caption,
      postUrl: uploaded.public_id
    })

    await profileModel.findOneAndUpdate(
      { profileId: user._id },
      { $inc: { postCount: 1 } },
      { new: true }
    )

    return res.status(200).json({
      success: true,
      message: 'Post saved successfully',
      post
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// ------------------------------------------
// GET FEED
// ------------------------------------------

const getPost = async (req, res) => {
  const limit = Number(req.query.limit) || 10
  const page = Number(req.query.page) || 0
  const skip = page * limit
  const userId = req.user?.id

  if (!userId) return res.status(400).json({ success: false, message: 'Invalid user' })

  try {
    // 1️⃣ PRE-FETCH CONTEXT
    // We need to know who the user follows to boost those posts in the ranking
    const following = await followUnfollowModel.find({ followerId: userId }).select('followingId')
    const followingIds = following.map(f => f.followingId.toString())

    // 2️⃣ AGGREGATION PIPELINE
    // This replaces Post.find() and Question.find()
    const feedCursor = await Post.aggregate([
      // Step A: Merge Questions into the Post stream
      { 
        $unionWith: { 
          coll: 'questions', // Ensure this matches your actual MongoDB collection name
          pipeline: [{ $addFields: { type: 'question' } }] 
        } 
      },
      
      // Step B: Calculate Time Decay & Following Status
      {
        $addFields: {
          // Convert ObjectId comparison to boolean for calculation
          isFollowingAuthor: { $in: [{ $toString: "$userId" }, followingIds] },
          
          // Calculate hours since creation (for time decay)
          // (CurrentTime - CreatedAt) / 1000ms / 60s / 60m
          hoursOld: {
            $divide: [
              { $subtract: [new Date(), "$createdAt"] },
              1000 * 60 * 60
            ]
          }
        }
      },

      // Step C: ASSIGN SCORES (The Ranking Logic)
      {
        $addFields: {
          rankingScore: {
            $add: [
              // 1. Popularity: Likes * 1 point
              { $ifNull: ["$likedCount", 0] },
              
              // 2. Dislikes: Subtract points (optional)
              { $multiply: [{ $ifNull: ["$dislikedCount", 0] }, -1] },

              // 3. Affinity: If following, give a HUGE boost (e.g., 50 points)
              { $cond: [{ $eq: ["$isFollowingAuthor", true] }, 50, 0] },

              // 4. Recency: Gravity function. 
              // Score decreases as hours increase. Using 100 as base gravity.
              // Formula: 100 / (hoursOld + 2)^1.5
              { 
                $divide: [
                  100, 
                  { $pow: [{ $add: ["$hoursOld", 2] }, 1.5] } 
                ] 
              }
            ]
          }
        }
      },

      // Step D: Sort by the Calculated Score (Highest first)
      { $sort: { rankingScore: -1, createdAt: -1 } },

      // Step E: Pagination
      { $skip: skip },
      { $limit: limit }
    ])

    // If feed is empty
    if (!feedCursor.length) {
       return res.status(200).json({ success: true, posts: [] })
    }

    // --- FROM HERE, YOUR ORIGINAL "HYDRATION" LOGIC REMAINS (OPTIMIZED) ---
    
    // 3️⃣ Collect IDs from the aggregated result
    const feed = feedCursor
    const postImageIds = feed.map((item) => item.postUrl).filter(Boolean)
    const authorIds = feed.map((item) => item.userId) // Renamed for clarity
    const itemIds = feed.map((item) => item._id)

    // 4️⃣ Fetch Related Data in Parallel (Faster)
    const [
      users, 
      profiles, 
      signedPostImages, 
      userLikes, 
      userDislikes, 
      userSaved
    ] = await Promise.all([
      User.find({ _id: { $in: authorIds } }).select('_id FullName userName'),
      profileModel.find({ profileId: { $in: authorIds } }).select('profileId profileImageId'),
      getMediaById(postImageIds),
      // Optimization: Only fetch likes for these specific items
      likeModel.find({ userId, itemId: { $in: itemIds } }),
      dislikedModel.find({ userId, itemId: { $in: itemIds } }),
      savedItemModel.find({ userId, itemId: { $in: itemIds } })
    ])

    // 5️⃣ Process Images (Get Profile Signed URLs)
    const profileImageIds = profiles.map(p => p.profileImageId)
    const signedProfileImages = await getMediaById(profileImageIds)

    // 6️⃣ Build Lookup Maps (HashMaps for O(1) access)
    const userMap = new Map(users.map(u => [u._id.toString(), u]))
    const profileImgIdMap = new Map(profiles.map(p => [p.profileId.toString(), p.profileImageId]))
    
    const postUrlMap = new Map(signedPostImages.map(img => [img.id, img.url]))
    const profileUrlMap = new Map(signedProfileImages.map(img => [img.id, img.url]))

    const likedSet = new Set(userLikes.map(l => l.itemId.toString()))
    const dislikedSet = new Set(userDislikes.map(d => d.itemId.toString()))
    const savedSet = new Set(userSaved.map(s => s.itemId.toString()))
    const followingSet = new Set(followingIds)

    // 7️⃣ Final Merge
    const finalData = feed.map((item) => {
      const userIdStr = item.userId.toString()
      const itemIdStr = item._id.toString()
      const userObj = userMap.get(userIdStr)
      const pImgId = profileImgIdMap.get(userIdStr)

      return {
        _id: item._id,
        caption: item.caption || null,
        createdAt: item.createdAt,
        postType: item.type || 'post',
        rankingScore: item.rankingScore, // Debug: useful to see why items are ranked this way

        // Images
        postUrl: item.postUrl ? postUrlMap.get(item.postUrl) : null,
        profileImage: pImgId ? profileUrlMap.get(pImgId) : null,

        // User Details
        postedBy: userObj ? {
          fullName: userObj.FullName,
          userName: userObj.userName,
          userId: userObj._id
        } : null,

        // Questions Specific
        questionTitle: item.questionTitle || null,
        questionDescription: item.questionDescription || null,

        // Status Flags
        isFollowing: followingSet.has(userIdStr),
        isLiked: likedSet.has(itemIdStr),
        isSaved: savedSet.has(itemIdStr),
        isDisliked: dislikedSet.has(itemIdStr),

        // Counts
        likes: item.likedCount || 0,
        dislikes: item.dislikedCount || 0
      }
    })

    return res.status(200).json({
      success: true,
      count: finalData.length,
      posts: finalData
    })

  } catch (error) {

    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const singlePost = async (req, res) => {
  try {
    const { postId, postType } = req.params
    if (!postId && !postType) {
      return res.status(400).json({ success: false, message: 'Invalid post' })
    }

    const targetModel = modelMapping[postType] || Post
    const post = await targetModel.findById(postId)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }
    if (post.type === 'post') {
      const media = await getMediaById([post.postUrl])
      post.postImage = media[0] ? media[0].url : null
    }
    const [profile, user] = await Promise.all([
      profileModel.findOne({ profileId: post.userId }).select('profileImageId'),
      User.findById(post.userId).select('fullName userName')
    ])

    const getProfileMedia = await getMediaById([profile.profileImageId])
    profile.imageUrl = getProfileMedia[0] ? getProfileMedia[0].url : null

    if (req.user?.id) {
      const userId = req.user.id
      const [likeRecord, dislikeRecord, savedRecord, followRecord] = await Promise.all([
        likeModel.findOne({ userId, itemId: post._id, itemType: post.type || 'post' }),
        dislikedModel.findOne({ userId, itemId: post._id, itemType: post.type || 'post' }),
        savedItemModel.findOne({ userId, itemId: post._id, itemType: post.type || 'post' }),
        followModel.findOne({ userId, itemId: post.userId, itemType: 'user' })
      ])
      post.isLiked = likeRecord ? true : false
      post.isdislikes = dislikeRecord ? true : false
      post.isSaved = savedRecord ? true : false
      post.isFollowing = followRecord ? true : false
    }
    return res.status(200).json({
      success: true,
      message: 'Post fetched successfully',
      post: {
        _id: post._id,
        caption: post.caption || null,
        createdAt: post.createdAt,
        postUrl: post.postImage || null,
        postType: post.type || 'post',
        userId: post.userId || null,
        questionTitle: post.questionTitle || null,
        questionDescription: post.questionDescription || null,
        postedBy: {
          fullName: user ? user.fullName : '',
          userName: user ? user.userName : '',
          userId: user ? user._id : ''
        },
        profileImage: profile ? profile.imageUrl : null,
        isFollowing: post.isFollowing || false,
        commentCount: post.commentCount || 0,
        isLiked: post.isLiked || false,
        isSaved: post.isSaved || false,
        likes: post.likedCount || 0,
        isdislikes: post.isdislikes || false,
        dislikes: post.dislikedCount || 0
      }
    })
  } catch (err) {
   
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
module.exports = { createPost, getPost, singlePost }
