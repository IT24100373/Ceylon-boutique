const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// -------------------------------------------------------
// Image Upload Middleware (Multer + Cloudinary)
// -------------------------------------------------------
// Handles multipart/form-data file uploads.
// Images are uploaded directly to Cloudinary cloud storage.
// Validates file type (JPG, PNG, WEBP) and size (max 5MB).
// -------------------------------------------------------

// --- Configure Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Cloudinary Storage ---
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ceylon-boutique',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

// File filter — only allow JPG, PNG, WEBP
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeValid = ALLOWED_TYPES.includes(file.mimetype);
  const extValid = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeValid && extValid) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file format "${ext}". Only JPG, PNG, and WEBP images are allowed.`
      ),
      false
    );
  }
};

// Max file size: 5MB per image
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// --- Single image upload (for profile pictures, shop logos, etc.) ---
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

// --- Multiple image upload (for product images — max 10) ---
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).array('images', 10);

// -------------------------------------------------------
// Wrapper middleware that provides user-friendly errors
// -------------------------------------------------------
const handleUploadErrors = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum allowed size is 5MB per image.',
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 10 images allowed per upload.',
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name. Use "images" for multiple files or "image" for a single file.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    }

    if (err) {
      // Custom errors (e.g., file filter rejection)
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload failed.',
      });
    }

    next();
  });
};

module.exports = {
  uploadSingleImage: handleUploadErrors(uploadSingle),
  uploadMultipleImages: handleUploadErrors(uploadMultiple),
  cloudinary, // Export configured instance for use in controller (e.g., delete)
};
