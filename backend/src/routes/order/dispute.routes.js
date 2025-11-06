const express = require("express");
const DisputeController = require("../../controller/order/dispute.controller");
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");

const router = express.Router();

router.post("/", authenticateToken,   DisputeController.createDispute);
router.get("/", authenticateToken, authorizeRoles("moderator"), DisputeController.getAllDisputes);
router.get("/:id", authenticateToken, DisputeController.getDisputeById);
router.put("/:id/resolve", authorizeRoles("moderator"), DisputeController.resolveDispute);

module.exports = router;