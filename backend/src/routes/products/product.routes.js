const express = require("express");
const {
  addProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  getProductById,
} = require("../../controller/products/product.controller");
const { listAllItems, getProductByProductId, searchProduct, viewFeatureProduct, listSearchTags } = require("../../controller/products/productPublic.controller");
const { upload } = require("../../middleware/upload.middleware");
const { authenticateToken } = require("../../middleware/auth");

const router = express.Router();

// product public - define BEFORE generic "/:id" routes to avoid conflicts
router.get("/product/public", listAllItems);
router.get("/product/search", searchProduct);
router.get("/product/featured", viewFeatureProduct);
router.get("/product/tags", listSearchTags);
router.get("/product/:id", getProductByProductId);

// authenticated user/product routes
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

module.exports = router;
