const express = require("express");
const {
  addProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  getProductById,
} = require("../../controller/products/product.controller");

const {
  getPendingProducts,
  getPendingProductDetails,
  approveProduct,
  rejectProduct,
} = require("../../controller/products/moderator.product.controller");

const {listAllItems, getProductByProductId} = require("../../controller/products/productPublic.controller");
const { upload } = require("../../middleware/upload.middleware");
const { authenticateToken } = require("../../middleware/auth");

const router = express.Router();

//moderator
router.get("/pending", authenticateToken, getPendingProducts);
router.get("/pending/:id", authenticateToken, getPendingProductDetails);
router.put("/pending/:id/approve", authenticateToken, approveProduct);
router.put("/pending/:id/reject", authenticateToken, rejectProduct);

//product public
router.get("/product/public", listAllItems);
router.get("/product/:id", getProductByProductId);

//owner
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
