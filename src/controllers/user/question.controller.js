const User = require('../../models/user/user.model')
const Question = require('../../models/user/question.model');
const Profile = require('../../models/user/profile.model')
const createQuestion = async (req, res) => {

  const {title , description , tags} = req.body
  const id = req.user?.id;
  if(!id) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user'
    })
  }

  try {
    const user = await User.findById(id)
    if(!user) {
      return res.status(400).json({
        success: false,
        message: 'User not exist'
      })
    }

    const question = await Question.create({
      userId: user._id,
      questionTitle: title,
      questionDescription: description,
      questionTags: tags
    })
    
    const updateCount = await Profile.findOneAndUpdate(
      { profileId: user._id },
      { $inc: { questionCount: 1 } },
      { new: true }
    )
   
    return res.status(200).json({
      success: true,
      message: 'Question created successfully',
      question
    })
  } catch (error) {
   
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

module.exports = {
  createQuestion
}