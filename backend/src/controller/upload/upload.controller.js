const ItemImages = require("../../models/ItemImage.model");
const { uploadToCloudinary } = require("../../middleware/upload.middleware");
const fs = require("fs");

const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No images provided" });
    }

    const cloudinaryResults = await uploadToCloudinary(req.files);
    const images = [];

    for (let i = 0; i < cloudinaryResults.length; i++) {
      const imageData = cloudinaryResults[i];
      const image = await ItemImages.create({
        Url: imageData.Url,
        IsPrimary: imageData.IsPrimary,
        Ordinal: imageData.Ordinal,
        AltText: imageData.AltText,
        IsDeleted: false,
      });
      images.push(image);

      // Xóa file tạm nếu còn tồn tại trong pho đờ upload
      try {
        if (fs.existsSync(req.files[i].path)) {
          fs.unlinkSync(req.files[i].path);
        }
      } catch (err) {
        console.warn("Không thể xóa file tạm:", req.files[i].path, err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      data: images,
    });
  } catch (error) {
    console.error("Upload images error:", error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};


module.exports = { uploadImages };
