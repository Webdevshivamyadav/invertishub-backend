const express = require('express');
const  router = express.Router();
const { createQuestion } = require('../../controllers/user/question.controller');
const { authUser } = require('../../middlewares/user.middleware');
router.post('/create-question',authUser, createQuestion);

module.exports = router