const mongoose = require('mongoose');

// -------------------------------------------------------
// Module 3 — Product & Inventory Model
// -------------------------------------------------------
// Each product belongs to ONE seller (via their Seller profile).
// Stock is tracked at the variant level (size × color).
// Supports soft-delete and unpublish for safe removal.
// -------------------------------------------------------

const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: [true, 'Variant size is required'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Variant color is required'],
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    // --- Link to Seller profile (many-to-one) ---
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },

    // --- Product Details ---
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      enum: {
        values: [
          'Saree & Traditional',
          'Dresses',
          'Tops & Blouses',
          'Pants & Trousers',
          'Skirts',
          "Men's Shirts",
          "Men's Trousers",
          'Kids Wear',
          'Accessories',
          'Footwear',
          'Other',
        ],
        message: '{VALUE} is not a valid product category',
      },
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [1, 'Price must be at least LKR 1'],
    },

    // --- Sizes available (quick reference) ---
    sizes: {
      type: [String],
      required: [true, 'At least one size is required'],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one size must be specified',
      },
    },

    // --- Colors available ---
    colors: [
      {
        name: {
          type: String,
          required: [true, 'Color name is required'],
          trim: true,
        },
        hexCode: {
          type: String,
          trim: true,
          default: '#000000',
        },
      },
    ],

    // --- Product Images (URLs — placeholder for file upload) ---
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
      validate: [
        {
          validator: (v) => v.length >= 1,
          message: 'At least one image is required',
        },
        {
          validator: (v) => v.length <= 10,
          message: 'Maximum 10 images allowed',
        },
      ],
    },

    // --- Variant-level stock tracking (size × color) ---
    variants: {
      type: [variantSchema],
      required: [true, 'At least one variant is required'],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one variant (size/color/stock) must be specified',
      },
    },

    // --- Computed total stock ---
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Publishing & soft-delete ---
    isPublished: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // --- Ratings (updated by Module 5) ---
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// -------------------------------------------------------
// Pre-save hook: auto-compute totalStock from variants
// -------------------------------------------------------
productSchema.pre('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce((sum, v) => sum + v.stock, 0);
  } else {
    this.totalStock = 0;
  }
  next();
});

// -------------------------------------------------------
// Indexes for faster queries
// -------------------------------------------------------
productSchema.index({ seller: 1, isPublished: 1, isDeleted: 1 });
productSchema.index({ category: 1, isPublished: 1, isDeleted: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
