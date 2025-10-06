const express = require("express")
const router = express.Router()
const userController = require("../../controller/user/user.controller")
const { authenticateToken } = require("../../middleware/auth")

router.get('/', authenticateToken, userController.getProfile);

module.exports = router;