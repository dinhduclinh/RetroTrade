const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Đã tạo thư mục upload tại:", uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ hỗ trợ file ảnh JPEG/JPG/PNG"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

const uploadToCloudinary = async (files) => {
  const uploadPromises = files.map((file) =>
    cloudinary.uploader.upload(file.path, {
      folder: "retrotrade/",
      resource_type: "image",
    })
  );

  const results = await Promise.all(uploadPromises);

  files.forEach((file) => {
    fs.unlink(file.path, (err) => {
      if (err) console.error("Lỗi xóa file tạm:", file.path);
    });
  });

  return results.map((result, index) => ({
    Url: result.secure_url,
    IsPrimary: index === 0,
    Ordinal: index,
    AltText: files[index].originalname,
  }));
};

module.exports = { upload, uploadToCloudinary };
