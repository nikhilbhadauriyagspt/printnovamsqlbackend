const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, googleLogin } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
