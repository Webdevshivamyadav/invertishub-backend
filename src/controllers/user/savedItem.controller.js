const savedItemModel = require('../../models/user/savedItem.model')
const postModel = require('../../models/user/post.model')
const questionModel = require('../../models/user/question.model')

const MODEL_MAP = {
  post: postModel,
  question: questionModel
}
const tooggleSavedItem = async ( req , res ) =>{
  try {
    const {itemId,itemType} = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    if (!itemId || !itemType) {
      return res.status(400).json({ success: false, message: 'Missing itemId or itemType' })
    }

    const TargetModel = MODEL_MAP[itemType]
    if (!TargetModel) {
      return res.status(400).json({ success: false, message: 'Invalid item type' })
    }

    const targetItem = await TargetModel.findById(itemId)
    if (!targetItem) {
      return res.status(404).json({ success: false, message: `${itemType} not found` })
    }

    const existingSavedItem = await savedItemModel.findOne({ userId, itemId, itemType })

    if (existingSavedItem) {
      // unlink saved item 
      await savedItemModel.findByIdAndDelete(existingSavedItem._id)
      return res.status(200).json({ success: true, message: 'Item removed from saved' })
      
    }else{
      const savedItem = await savedItemModel.create({
        userId,
        itemId,
        itemType
      })
      return res.status(201).json({ success: true, message: 'Item saved successfully', data: savedItem })
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = {tooggleSavedItem}