const mongoose = require('mongoose');

// -------------------------------------------------------
// Module 2 — Seller & Shop Profile Model
// -------------------------------------------------------
// Each seller has ONE shop profile, linked to their User account.
// This is a separate collection (like Address) so we keep
// the User model clean and focused on authentication only.
// -------------------------------------------------------

const sellerSchema = new mongoose.Schema(
  {
    // --- Link to User account (1-to-1) ---
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One seller profile per user
    },

    // --- Shop Details ---
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Shop name must be at least 3 characters'],
      maxlength: [100, 'Shop name cannot exceed 100 characters'],
    },
    shopDescription: {
      type: String,
      trim: true,
      maxlength: [1000, 'Shop description cannot exceed 1000 characters'],
      default: '',
    },
    shopLogo: {
      type: String, // URL to logo image (placeholder for file upload)
      trim: true,
      default: '',
    },
    shopBanner: {
      type: String, // URL to banner image (placeholder for file upload)
      trim: true,
      default: '',
    },
    categoryFocus: {
      type: String,
      trim: true,
      maxlength: [100, 'Category focus cannot exceed 100 characters'],
      default: '',
    },

    // --- Business Documents ---
    businessRegNumber: {
      type: String,
      required: [true, 'Business registration number is required'],
      trim: true,
    },
    nicNumber: {
      type: String,
      required: [true, 'NIC number is required'],
      trim: true,
      match: [
        /^([0-9]{9}[vVxX]|[0-9]{12})$/,
        'Please enter a valid Sri Lankan NIC number',
      ],
    },
    documentsUrl: {
      type: String, // URL to uploaded documents (placeholder for file upload)
      trim: true,
      default: '',
    },

    // --- Bank Account Details (for payouts) ---
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
    },
    bankBranch: {
      type: String,
      required: [true, 'Bank branch is required'],
      trim: true,
    },
    bankAccountNumber: {
      type: String,
      required: [true, 'Bank account number is required'],
      trim: true,
    },
    bankAccountName: {
      type: String,
      required: [true, 'Bank account holder name is required'],
      trim: true,
    },

    // --- Contact Address ---
    contactAddress: {
      addressLine1: {
        type: String,
        required: [true, 'Contact address line 1 is required'],
        trim: true,
        maxlength: [200, 'Address line 1 cannot exceed 200 characters'],
      },
      addressLine2: {
        type: String,
        trim: true,
        maxlength: [200, 'Address line 2 cannot exceed 200 characters'],
        default: '',
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      province: {
        type: String,
        required: [true, 'Province is required'],
        trim: true,
        enum: [
          'Western',
          'Central',
          'Southern',
          'Northern',
          'Eastern',
          'North Western',
          'North Central',
          'Uva',
          'Sabaragamuwa',
        ],
      },
      postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true,
        match: [/^[0-9]{5}$/, 'Please enter a valid 5-digit postal code'],
      },
    },

    // --- Verification Status (managed by admin) ---
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended', 'removed'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    suspensionReason: {
      type: String,
      trim: true,
      default: '',
    },

    // --- Stats (updated by other modules) ---
    productCount: {
      type: Number,
      default: 0,
    },
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
// Index for faster lookups
// -------------------------------------------------------
sellerSchema.index({ verificationStatus: 1 });
sellerSchema.index({ shopName: 'text', categoryFocus: 'text' });

const Seller = mongoose.model('Seller', sellerSchema);
module.exports = Seller;
