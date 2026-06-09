const { signup, login } = require('../Controllers/authController');
const { signupValidation, loginValidation } = require('../Middlewares/authValidation');

const router = require('express').Router();

router.post('/login', loginValidation, login);
router.post('/signup', signupValidation, signup);

module.exports = router;