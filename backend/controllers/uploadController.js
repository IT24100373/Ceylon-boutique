const path = require('path');
const fs = require('fs');

// -------------------------------------------------------
// Image Upload Controller
// -------------------------------------------------------
// Handles uploaded image files and returns their accessible URLs.
// Supports both single and multiple image uploads.
// -------------------------------------------------------

// -------------------------------------------------------
// POST /api/upload/images
// Upload multiple product images (up to 10)
// Returns array of image URLs
// -------------------------------------------------------
const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided. Please select at least one image file.',
      });
    }

    // Build accessible URLs for each uploaded file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrls = req.files.map((file) => {
      return `${baseUrl}/uploads/products/${file.filename}`;
    });

    res.status(200).json({
      success: true,
      message: `${req.files.length} image(s) uploaded successfully.`,
      count: imageUrls.length,
      images: imageUrls,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// POST /api/upload/image
// Upload a single image (for shop logos, profile pics, etc.)
// Returns single image URL
// -------------------------------------------------------
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided. Please select an image file.',
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/products/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      image: imageUrl,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// DELETE /api/upload/image
// Delete an uploaded image by filename
// -------------------------------------------------------
const deleteImage = async (req, res, next) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required.',
      });
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(__dirname, '..', 'uploads', 'products', sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found.',
      });
    }

    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImages,
  uploadImage,
  deleteImage,
};
