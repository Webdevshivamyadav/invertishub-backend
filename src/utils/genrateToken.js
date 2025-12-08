const jwt = require('jsonwebtoken')

// genrate jwt token for sessions
const genrateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn: "7d"});
}

const genrateAcessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: "1m" });
};



module.exports = { genrateAcessToken  ,genrateRefreshToken}
