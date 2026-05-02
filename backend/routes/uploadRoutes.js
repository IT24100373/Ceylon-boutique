const express = require('express');
const router = express.Router();

const {
  uploadImages,
  uploadImage,
  deleteImage,
} = require('../controllers/uploadController');

const { uploadSingleImage, uploadMultipleImages } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

// -------------------------------------------------------
// Image Upload Routes
// All routes require authentication (JWT)
// -------------------------------------------------------

// POST /api/upload/images — Upload multiple product images (up to 10)
router.post('/images', protect, uploadMultipleImages, uploadImages);

// POST /api/upload/image — Upload a single image
router.post('/image', protect, uploadSingleImage, uploadImage);

// DELETE /api/upload/image — Delete an uploaded image
router.delete('/image', protect, deleteImage);

module.exports = router;
