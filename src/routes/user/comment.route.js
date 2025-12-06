const express = require('express');
const router = express.Router();
const { authUser } = require('../../middlewares/user.middleware');
const { addComment, deleteComment, getComments, toggleLikeComment } = require('../../controllers/user/comment.controller');


router.post('/create-comment', authUser, addComment);
router.post('/delete-comment', authUser, deleteComment);
router.post('/get-comments', authUser, getComments);
router.post('/toggle-like-comment', authUser, toggleLikeComment);
module.exports = router;