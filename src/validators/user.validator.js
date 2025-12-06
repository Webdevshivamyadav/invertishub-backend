const { body } = require('express-validator')
console.log(body)
exports.registerValidation = [
  body('user.fullName')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Name is requried')
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters')
    .isLength({ max: 20 })
    .withMessage('The maximum limit is 20 charcters'),

  body('username')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('username is required')
    .isLength({ min: 4 })
    .withMessage('username must 4 characters ')
    .isLength({ max: 10 })
    .withMessage('The maximum limit is 10 characters'),
  body('user.email').trim().escape().notEmpty().withMessage('email is required').isEmail()
]
