const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");
const taxController = require("../../controller/tax/tax.controller");

// Public route - Lấy cấu hình thuế hiện tại
router.get("/current", taxController.getCurrentTax);

// Admin routes - Quản lý cấu hình thuế
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  taxController.getAllTaxSettings
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  taxController.createTaxSetting
);

router.get(
  "/history/all",
  authenticateToken,
  authorizeRoles("admin"),
  taxController.getAllTaxHistory
);

router.get(
  "/:id/history",
  authenticateToken,
  authorizeRoles("admin"),
  taxController.getTaxHistory
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  taxController.updateTaxSetting
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  taxController.deleteTaxSetting
);

router.post(
  "/:id/activate",
  authenticateToken,
  authorizeRoles("admin"),
  taxController.activateTax
);

module.exports = router;

