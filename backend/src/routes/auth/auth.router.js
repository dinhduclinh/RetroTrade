const express = require("express")
const router = express.Router()

const userAuthController = require("../../controller/auth/auth.controller")

router.post('/login', userAuthController.login);
router.post('/register', userAuthController.register);
router.post('/resend-otp', userAuthController.resendOtp);
router.post('/verify-email', userAuthController.verifyEmail);
router.post('/request-forgot-password', userAuthController.requestForgotPassword);
router.post('/forgot-password-otp', userAuthController.forgotPasswordOTP);
router.post('/forgot-password', userAuthController.forgotPassword);
router.post('/refresh-token', userAuthController.refreshToken);


module.exports = router;