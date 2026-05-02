const { cloudinary } = require('../middleware/upload');

// -------------------------------------------------------
// Image Upload Controller (Cloudinary)
// -------------------------------------------------------
// Handles uploaded image files and returns their Cloudinary URLs.
// Images are stored on Cloudinary's cloud CDN — no local disk needed.
// -------------------------------------------------------

// -------------------------------------------------------
// POST /api/upload/images
// Upload multiple product images (up to 10)
// Returns array of Cloudinary image URLs
// -------------------------------------------------------
const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided. Please select at least one image file.',
      });
    }

    // Cloudinary URLs are already available in req.files[].path
    const imageUrls = req.files.map((file) => file.path);

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
// Returns single Cloudinary image URL
// -------------------------------------------------------
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided. Please select an image file.',
      });
    }

    // Cloudinary URL is available in req.file.path
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      image: req.file.path,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// DELETE /api/upload/image
// Delete an uploaded image from Cloudinary by URL or public ID
// -------------------------------------------------------
const deleteImage = async (req, res, next) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename (Cloudinary URL or public ID) is required.',
      });
    }

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/ceylon-boutique/abc123.jpg
    let publicId = filename;
    if (filename.includes('cloudinary.com')) {
      const urlParts = filename.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1) {
        // Everything after "upload/v12345/" is the public ID (without extension)
        const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
        publicId = pathAfterUpload.replace(/\.[^/.]+$/, ''); // Remove file extension
      }
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok' || result.result === 'not found') {
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully.',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete image from cloud storage.',
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImages,
  uploadImage,
  deleteImage,
};
