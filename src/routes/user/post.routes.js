const express = require('express');
const { createPost, getPost, singlePost } = require('../../controllers/user/post.controller');
const { authUser } = require('../../middlewares/user.middleware')
const router = express.Router();

router.post('/create-post',authUser, createPost);
router.get('/get-post',authUser, getPost);
router.get('/get-post/:postId/:postType',authUser, singlePost);

module.exports = router;