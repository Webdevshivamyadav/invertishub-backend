const express = require('express');
const router = express.Router();
const { authUser } = require('../../middlewares/user.middleware');
const {  tooggleSavedItem, } = require('../../controllers/user/savedItem.controller');

router.post('/toggle-saved-item', authUser, tooggleSavedItem);

module.exports = router;