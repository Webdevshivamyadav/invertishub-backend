const nodemailer = require('nodemailer')
const {config} = require('dotenv');
config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GOOGLE_APP_USER,
    pass: process.env.GOOGLE_APP_PASSWORD
  }
})
console.log(process.env.GOOGLE_APP_USER)
const sendMail = async (emailId, otp) => {
  const info = await transporter.sendMail({
    from: '"Shivam Yadav" <shivam6396649085yadav@gmail.com>',
    to: emailId,
    subject: 'Verify your OTP',
    text: `Your OTP is: ${otp}`,
    html: `<p>Your OTP is: <b>${otp}</b></p>`
  })

  return info
}

module.exports = { sendMail }
