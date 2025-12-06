const express = require('express');
const router = express.Router();
const {authUser} = require('../../middlewares/user.middleware')
const { follow, unfollow, toggleFollow } = require('../../controllers/user/followUnfollow.controller'); 

router.post('/toggle', authUser, toggleFollow);


module.exports = router;