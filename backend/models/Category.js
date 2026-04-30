const mongoose = require('mongoose');

// -------------------------------------------------------
// Module 6 — Category Model (Admin-managed)
// -------------------------------------------------------
// Dynamic product categories that admins can create,
// edit, and deactivate. Replaces the hardcoded enum
// in the Product model for new listings.
// -------------------------------------------------------

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    icon: {
      type: String,
      trim: true,
      default: '📦', // Default emoji icon
    },
    isActive: {
      type: Boolean,
      default: true, // Admin can deactivate (hides from new listings)
    },
    productCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
categorySchema.index({ isActive: 1 });
categorySchema.index({ name: 'text' });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
