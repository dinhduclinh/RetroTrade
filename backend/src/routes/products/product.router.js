const express = require("express");
const {
  addProduct,
} = require("../../controller/products/product.controller");
const { upload } = require("../../middleware/upload.middleware");
const { authenticateToken } = require("../../middleware/auth");

const router = express.Router();

router.post("/add", authenticateToken, addProduct);

module.exports = router;
