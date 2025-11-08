const express = require("express");
const router = express.Router();
const complaintController = require("../../controller/auth/complaint.controller");
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");
const pagination = require("../../middleware/pagination");

// Admin routes for complaints
router.get("/", authenticateToken, authorizeRoles("admin"), pagination(), complaintController.getAllComplaints);
router.get("/:id", authenticateToken, authorizeRoles("admin"), complaintController.getComplaintById);
router.post("/:id/handle", authenticateToken, authorizeRoles("admin"), complaintController.handleComplaint);

module.exports = router;

