const mongoose = require('mongoose');

// -------------------------------------------------------
// Module 5 — Reviews & Ratings Model
// -------------------------------------------------------
// Each review belongs to ONE customer and targets either
// a product OR a seller. A customer can submit:
//   - One product review per order item
//   - One seller review per order item
// Reviews are locked to delivered orders only.
// Soft-delete is used so ratings can be recalculated
// cleanly without losing the document for auditing.
// -------------------------------------------------------

const reviewSchema = new mongoose.Schema(
  {
    // --- Who wrote this review ---
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
    },

    // --- Which delivered order triggered the review ---
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
    },

    // --- Which specific item within the order ---
    // Stored as a string (item._id.toString()) to avoid sub-doc ref issues
    orderItem: {
      type: String,
      required: [true, 'Order item reference is required'],
      trim: true,
    },

    // --- Is this for a product or a seller? ---
    reviewType: {
      type: String,
      required: [true, 'Review type is required'],
      enum: {
        values: ['product', 'seller'],
        message: 'Review type must be "product" or "seller"',
      },
    },

    // --- Target references (one will be set based on reviewType) ---
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      default: null,
    },

    // --- Review Content ---
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewText: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review text cannot exceed 1000 characters'],
      default: '',
    },
    // Photo URLs — placeholder for file upload (max 3)
    photos: {
      type: [String],
      validate: {
        validator: (v) => v.length <= 3,
        message: 'Maximum 3 photos allowed per review',
      },
      default: [],
    },

    // --- Edit tracking ---
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },

    // --- Soft delete (customer deleted their own review) ---
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // --- Admin removal ---
    adminRemoved: {
      type: Boolean,
      default: false,
    },
    removalReason: {
      type: String,
      trim: true,
      default: '',
    },

    // --- Helpful votes (simple counter as per project decision) ---
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// -------------------------------------------------------
// Compound unique index:
// Prevents one customer from submitting more than one
// review of the same type for the same order item.
// -------------------------------------------------------
reviewSchema.index(
  { customer: 1, order: 1, orderItem: 1, reviewType: 1 },
  { unique: true }
);

// -------------------------------------------------------
// Indexes for common query patterns
// -------------------------------------------------------
reviewSchema.index({ product: 1, isDeleted: 1, adminRemoved: 1, createdAt: -1 });
reviewSchema.index({ seller: 1, isDeleted: 1, adminRemoved: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, isDeleted: 1, createdAt: -1 });
reviewSchema.index({ order: 1 });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
