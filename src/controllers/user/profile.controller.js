const profileModel = require('../../models/user/profile.model')
const User = require('../../models/user/user.model')
const { getMediaById } = require('./cloudSignature.controller')

const getUserProfile = async (req, res) => {

  const id = req.user?.id
 
  if (!id) {
    return res.status(400).json({
      message: 'Invalid user',
      success: false
    })
  }

  try {
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        message: 'user not found',
        success: false
      })
    }
    const getUserFullDetail = await profileModel.findOne({
      profileId: user._id
    })
    const profileImageSignedurl = await getMediaById(getUserFullDetail.profileImageId)
    if(!profileImageSignedurl){
      return res.status(200).json({
        message: 'Detail not founded',
        success: true,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.FullName,
          userName: user.userName,
          bio: getUserFullDetail.userBio,
          phone: getUserFullDetail.phone,
          followerCount: getUserFullDetail.followerCount,
          followingCount: getUserFullDetail.followingCount,
          questionCount: getUserFullDetail.questionCount,
          answerCount: getUserFullDetail.answerCount,
          postCount: getUserFullDetail.postCount
        }
      })
    }
   
      return res.status(200).json({
        message: 'Detail founded',
        success: true,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.FullName,
          userName: user.userName,
          profileImage: profileImageSignedurl.url,
          bio: getUserFullDetail.userBio,
          phone: getUserFullDetail.phone,
          followerCount: getUserFullDetail.followerCount,
          followingCount: getUserFullDetail.followingCount,
          questionCount: getUserFullDetail.questionCount,
          answerCount: getUserFullDetail.answerCount,
          postCount: getUserFullDetail.postCount
        }
      })
    
  } catch (error) {
  
    return res.status(500).json({
      message: 'Internal server error',
      success: false
    })
  }
}

module.exports = {
  getUserProfile
}
