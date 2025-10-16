const express = require("express");
const {
  addProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
} = require("../../controller/products/product.controller");
const { upload } = require("../../middleware/upload.middleware");
const { authenticateToken } = require("../../middleware/auth");

const router = express.Router();

router.get("/user", authenticateToken, getUserProducts);
router.post("/add", authenticateToken, addProduct);
router.put(
  "/update/:id",
  authenticateToken,
  upload.array("images", 10),
  updateProduct
);
router.delete("/:id", authenticateToken, deleteProduct);

module.exports = router;
