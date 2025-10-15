const express = require("express")
const router = express.Router()
const userController = require("../../controller/user/user.controller")
const profileController = require("../../controller/auth/auth.profile.controller")
const { authenticateToken } = require("../../middleware/auth")

router.get('/', userController.getAllUsers);
router.get('/profile', authenticateToken, profileController.getProfile);
router.put('/profile', authenticateToken, profileController.updateProfile);
router.put('/profile/avatar', authenticateToken, profileController.updateAvatar);
router.put('/profile/change-password', authenticateToken, profileController.changePassword);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;