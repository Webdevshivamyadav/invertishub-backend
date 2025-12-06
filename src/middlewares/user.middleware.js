const userModel = require('../models/user/user.model')
const { verifyToken } = require('../utils/genrateToken')
const jwt = require('jsonwebtoken')
const authUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid Authorization format' });
  
  const token = parts[1];
  
  if (!token) {
    return res.status(401).json({
      message: 'Unauthorized access. Please log in. '
    })
  }
 
  try {
    const decode = jwt.verify(token,process.env.JWT_ACCESS_SECRET);
    const user = await userModel.findById(decode.id)
    if (!user) {
      return res.status(404).json({
        message: 'User not Found',
        status: false
      })
    }

    req.user = user
    next()
  } catch (err) {

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' })
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token. Please log in again.' })
    }

    return res.status(500).json({ message: 'Authentication failed.' })
  }
}

module.exports = { authUser }
