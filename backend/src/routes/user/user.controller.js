const express = require("express")
const router = express.Router()
const userController = require("../../controller/user/user.controller")
const { authenticateToken } = require("../../middleware/auth")

router.get('/', userController.getAllUsers);
router.get('/profile', authenticateToken, userController.getProfile);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;