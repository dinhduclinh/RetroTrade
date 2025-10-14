// src/routes/products/upload.router.js (New: Route for image upload)
const express = require("express");
const { uploadImages } = require("../../../controller/upload/upload.controller");
const { upload } = require("../../../middleware/upload.middleware"); // Multer for FormData
const { authenticateToken } = require("../../../middleware/auth");

const router = express.Router();

router.post("/", upload.array("images", 10), authenticateToken, uploadImages);

module.exports = router;
