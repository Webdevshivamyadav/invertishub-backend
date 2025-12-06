const jwt = require('jsonwebtoken')

// genrate jwt token for sessions
const genrateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn: "30m"});
}

const genrateAcessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: "7d" });
};



module.exports = { genrateAcessToken  ,genrateRefreshToken}
