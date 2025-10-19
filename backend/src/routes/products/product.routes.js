const express = require("express");
const {
  addProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  getProductById,
} = require("../../controller/products/product.controller");
const {listAllItems, getProductByProductId} = require("../../controller/products/productPublic.controller");
const { upload } = require("../../middleware/upload.middleware");
const { authenticateToken } = require("../../middleware/auth");

const router = express.Router();

router.get("/user", authenticateToken, getUserProducts);
router.post("/add", authenticateToken, addProduct);
router.get("/:id", authenticateToken, getProductById);
router.put(
  "/:id",
  authenticateToken,
  upload.array("images", 10),
  updateProduct
);
router.delete("/:id", authenticateToken, deleteProduct);

//product public
router.get("/product/public", listAllItems);
router.get("/product/:id", getProductByProductId);

module.exports = router;
