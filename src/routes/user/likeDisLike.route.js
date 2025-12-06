const express = require('express');
const router = express.Router();
const { authUser } = require('../../middlewares/user.middleware');
const { liked, toggleInteraction } = require('../../controllers/user/like.controller');
const { disliked } = require('../../controllers/user/like.controller');

router.post('/toggle-like', authUser, toggleInteraction);

module.exports = router