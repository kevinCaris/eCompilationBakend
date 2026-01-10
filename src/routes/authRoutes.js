const express = require('express');
const { requestCode, verifyCode, resendCode, getMe, logout } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/auth/login', requestCode);

router.post('/auth/verify', verifyCode);

router.post('/auth/resend', resendCode);

router.get('/auth/me', authenticate, getMe);

router.post('/auth/logout', authenticate, logout);

module.exports = router;