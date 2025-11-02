const express = require("express");
const {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} = require("../../controller/contract/contract.controller");
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");

const router = express.Router();

const adminOnly = [authenticateToken, authorizeRoles("admin")];


router.post("/templates", adminOnly, createTemplate);
router.get("/templates", adminOnly, getTemplates);
router.get("/templates/:id", adminOnly, getTemplateById);
router.put("/templates/:id", adminOnly, updateTemplate);
router.delete("/templates/:id", adminOnly, deleteTemplate);

module.exports = router;
