const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        let resource_type = 'image';
        const videoFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
        if (videoFormats.includes(file.mimetype)) {
            resource_type = 'video';
        }

        return {
            folder: resource_type === 'image' ? 'nutigo/images' : 'nutigo/videos',
            resource_type,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi'],
            transformation: resource_type === 'image' ? [{ width: 1000, crop: 'limit' }] : undefined
        };
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 
    }
});

module.exports = { cloudinary, upload };
