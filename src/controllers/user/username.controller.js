const User = require("../../models/user/user.model");

const findUserName = async (req, res) => {
 
  const { username} = req.body;

  try {
    // Await the query result
    const matched = await User.find({ userName: username });

    if (matched.length > 0 && matched.isVerified === true) {
      return res.status(400).json({
        message: "Username not available",
        isAvailable: false,
      });
    }

    return res.status(200).json({
      message: "Username available",
      isAvailable: true,
    });
  } catch (error) {
   
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

module.exports = {
  findUserName,
};
