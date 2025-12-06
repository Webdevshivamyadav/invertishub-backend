const reportModel = require('../../models/user/report.model');
const addReport = async (req, res) => {
  try {
     const { postId , reason} = req.body;
     const userId = req.user?.id;

     if(!userId){
      return res.status(401).json({success : false , message : 'Unauthorized'})
     }

     if(!postId || !reason){
      return res.status(400).json({success : false , message : 'Missing postId or reason'})
     }
     
     const isAlredyReported = await reportModel.findOne({userId , postId});

     if(isAlredyReported){
      return res.status(400).json({success : false , message : 'You have already reported this post'})
     }

     const newReport = await reportModel.create({
      userId,
      postId,
      reason
     })

     return res.status(201).json({success : true , message : 'Report added successfully'})
  } catch (error) {
    return res.status(500).json({success : false , message : 'Internal server error'})
  }
}

module.exports = {addReport}