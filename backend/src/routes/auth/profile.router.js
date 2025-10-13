const express = require("express")
const router = express.Router()
const userController = require("../../controller/auth/auth.profile.controller")
const { authenticateToken } = require("../../middleware/auth")

router.get('/', authenticateToken, userController.getProfile);
router.put('/', authenticateToken, userController.updateProfile);

module.exports = router;