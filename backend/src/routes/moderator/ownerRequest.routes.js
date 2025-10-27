const express = require("express");
const router = express.Router();
const ownerRequestController = require("../../controller/user/ownerRequest.controller");
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");
const pagination = require("../../middleware/pagination");

// User routes
router.post("/", authenticateToken, ownerRequestController.createOwnerRequest);
router.get("/my-requests", authenticateToken, ownerRequestController.getMyOwnerRequests);
router.get("/:id", authenticateToken, ownerRequestController.getOwnerRequestById);
router.put("/:id/cancel", authenticateToken, ownerRequestController.cancelOwnerRequest);

// Moderator routes only
router.get("/", authenticateToken, authorizeRoles("moderator"), pagination(), ownerRequestController.getAllOwnerRequests);
router.put("/:id/approve", authenticateToken, authorizeRoles("moderator"), ownerRequestController.approveOwnerRequest);
router.put("/:id/reject", authenticateToken, authorizeRoles("moderator"), ownerRequestController.rejectOwnerRequest);
router.get("/stats/overview", authenticateToken, authorizeRoles("moderator"), ownerRequestController.getOwnerRequestStats);

module.exports = router;

