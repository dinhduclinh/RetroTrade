const express = require("express")
const router = express.Router()
const userController = require("../../controller/user/user.controller")
const profileController = require("../../controller/auth/auth.profile.controller")
const { authenticateToken, authorizeRoles } = require("../../middleware/auth")
const pagination = require("../../middleware/pagination")


router.get('/', pagination(), userController.getAllUsers);
router.get('/:id', userController.getUserById);


router.get('/profile/me', authenticateToken, userController.getProfile);
router.post('/', authenticateToken, authorizeRoles('admin', 'moderator'), userController.createUser);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'moderator'), userController.updateUser);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), userController.deleteUser);
router.put('/role/update', authenticateToken, authorizeRoles('admin', 'moderator'), userController.updateUserRole);

module.exports = router;