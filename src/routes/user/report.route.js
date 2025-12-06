const express = require('express');
const router = express.Router();
const { authUser } = require('../../middlewares/user.middleware');
const { addReport } = require('../../controllers/user/report.controller');

router.post('/make-report', authUser, addReport);
module.exports = router ;