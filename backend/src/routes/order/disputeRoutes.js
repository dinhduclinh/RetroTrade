import express from "express";
import {
  createDispute,
  getAllDisputes,
  getDisputeById,
  resolveDispute,
} from "../../controller/order/dispute.controller";
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");

const router = express.Router();

router.post("/dispute/", createDispute);
router.get("/dispute/", getAllDisputes);
router.get("/dispute/:id", getDisputeById);
router.put("/dispute/:id/resolve", resolveDispute);

export default router;
