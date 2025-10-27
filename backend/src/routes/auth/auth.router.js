const express = require("express")
const router = express.Router()

const userAuthController = require("../../controller/auth/auth.controller")
const verifyController = require("../../controller/auth/verify.controller")
const profileRouter = require("./profile.router")
const { upload } = require("../../middleware/upload.middleware")
const { authenticateToken } = require("../../middleware/auth")

router.post('/login', userAuthController.login);
router.post('/register', userAuthController.register);
router.post('/resend-otp', userAuthController.resendOtp);
router.post('/verify-email', userAuthController.verifyEmail);
router.post('/request-forgot-password', userAuthController.requestForgotPassword);
router.post('/forgot-password-otp', userAuthController.forgotPasswordOTP);
router.post('/forgot-password', userAuthController.forgotPassword);
router.post('/refresh-token', userAuthController.refreshToken);
router.post('/login-with-google', userAuthController.loginWithGoogle);
router.post('/login-with-facebook', userAuthController.loginWithFacebook);

// Phone verification via Firebase ID token (client performs Firebase Phone Auth)
router.post('/phone/confirm-firebase', authenticateToken, verifyController.confirmPhoneWithFirebaseIdToken);
// Firebase Auth REST: send and verify OTP from backend (still needs recaptchaToken from client)
router.post('/phone/send-otp-firebase', authenticateToken, verifyController.sendOtpViaFirebase);
router.post('/phone/verify-otp-firebase', authenticateToken, verifyController.verifyOtpViaFirebase);

// Face verification using face-api.js with file upload (3 images: selfie, idCardFront, idCardBack)
router.post('/verify-face', authenticateToken, upload.array('images', 3), verifyController.verifyFaceImages);

// Profile routes (bao gồm avatar)
router.use('/profile', profileRouter);

module.exports = router;