const express = require("express");
const DisputeController = require("../../controller/order/dispute.controller");
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");
const { upload } = require("../../middleware/upload.middleware");
const router = express.Router();

router.post("/", authenticateToken,  upload.array("evidence", 5), DisputeController.createDispute);
router.get("/", authenticateToken, authorizeRoles("moderator"), DisputeController.getAllDisputes);
router.get("/:id", authenticateToken, DisputeController.getDisputeById);
router.put("/:id/resolve", authorizeRoles("moderator"), DisputeController.resolveDispute);

module.exports = router;