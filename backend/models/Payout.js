const mongoose = require('mongoose');

// -------------------------------------------------------
// Module 6 — Payout Model (Admin-managed)
// -------------------------------------------------------
// Tracks all seller payouts processed by admins.
// Each payout record is an audit trail entry showing
// when and how much was paid to a seller.
// -------------------------------------------------------

const payoutSchema = new mongoose.Schema(
  {
    // --- Which seller is being paid ---
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: [true, 'Seller reference is required'],
    },

    // --- Financial details ---
    amount: {
      type: Number,
      required: [true, 'Payout amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 10, // Platform commission percentage
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // --- Orders covered by this payout ---
    ordersIncluded: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],

    // --- Payout method and status ---
    method: {
      type: String,
      enum: ['bank_transfer', 'cash', 'other'],
      default: 'bank_transfer',
    },
    status: {
      type: String,
      enum: ['pending', 'processed'],
      default: 'processed',
    },

    // --- Admin who processed the payout ---
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin reference is required'],
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },

    // --- Notes ---
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
payoutSchema.index({ seller: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ processedBy: 1 });

const Payout = mongoose.model('Payout', payoutSchema);
module.exports = Payout;
