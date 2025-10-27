const express = require("express");
const router = express.Router();
const notificationController = require("../../controller/notification.controller");
const { authenticateToken } = require("../../middleware/auth");
const pagination = require("../../middleware/pagination");

// All routes require authentication
router.get("/", authenticateToken, pagination(), notificationController.getNotifications);
router.get("/unread-count", authenticateToken, notificationController.getUnreadCount);
router.put("/:id/read", authenticateToken, notificationController.markAsRead);
router.put("/read-all", authenticateToken, notificationController.markAllAsRead);
router.delete("/:id", authenticateToken, notificationController.deleteNotification);
router.delete("/read/all", authenticateToken, notificationController.deleteAllReadNotifications);

module.exports = router;

