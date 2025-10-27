const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");
const OrderController = require("../../controller/order/order.controller");

router.get("/:id",authenticateToken,OrderController.getOrder);
router.get("/", authenticateToken,OrderController.listOrders);
router.post("/", authenticateToken, authorizeRoles("renter", "owner"),OrderController.createOrder);
router.post("/:id/confirm", authenticateToken,OrderController.confirmOrder);
router.post("/:id/start", authenticateToken,OrderController.startOrder);
router.post("/:id/return", authenticateToken,OrderController.renterReturn);
router.post("/:id/complete", authenticateToken,OrderController.ownerComplete);
router.post("/:id/cancel",authenticateToken, OrderController.cancelOrder);
router.post("/:id/dispute", authenticateToken,OrderController.disputeOrder);


module.exports = router;