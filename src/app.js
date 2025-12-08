const express = require('express')
const app = express()
const cookie = require('cookie-parser')

const userRouter = require('./routes/user/user.route')
const postRouter = require('./routes/user/post.routes')
const questionRouter = require('./routes/user/question.route')
const followUnfollowRouter = require('./routes/user/followUnfollow.route')
const likeRouter = require('./routes/user/likeDisLike.route')
const commentRouter = require('./routes/user/comment.route')
const savedItemRouter = require('./routes/user/savedItem.route')
const cloudRouter = require('./routes/user/cloudinary.route')
const reportRouter = require('./routes/user/report.route')

const helmet = require('helmet')
const cors = require('cors')

app.use(
  cors({
    origin: process.env.FRONTEND_URL, // your Next.js app origin
    credentials: true // allow cookies / authorization headers
  })
)

app.use(express.json())
app.use(cookie())
app.use(helmet())
app.get('/', (req, res) => {
  res.send('welcome to invertishub')
})

app.use('/api/users', userRouter)
app.use('/api/cloud', cloudRouter)
app.use('/api/post', postRouter)
app.use('/api/question', questionRouter)
app.use('/api/toggle-follow', followUnfollowRouter)
app.use('/api/toggle-like', likeRouter)
app.use('/api/comment', commentRouter)
app.use('/api/save-item', savedItemRouter)
app.use('/api/report', reportRouter)

module.exports = app
