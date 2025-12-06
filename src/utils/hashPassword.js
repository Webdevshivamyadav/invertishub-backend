const bcrypt = require('bcrypt');

// convert plain password to hash password 
const hashPasswrod = async (password)=>{
   const hashedPassword = await bcrypt.hash(password,10);
   return hashedPassword
}

const verifyPassword = async (password,userpass) =>{
  
  const hashpashword=  await bcrypt.compare(password,userpass)
  return hashpashword
}
 
module.exports = {
  hashPasswrod,
  verifyPassword,
}