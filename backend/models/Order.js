const mongoose = require('mongoose');

// -------------------------------------------------------
// Module 4 — Order Management Model
// -------------------------------------------------------
// Each order belongs to ONE customer and contains one or
// more items. Product data is snapshotted at order time
// so the order record stays accurate even if the seller
// later edits or deletes the product.
// -------------------------------------------------------

// --- Order Item sub-schema (embedded, like Product variants) ---
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    // --- Snapshot fields (frozen at order time) ---
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    productImage: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    // --- Selected variant ---
    size: {
      type: String,
      required: [true, 'Size is required'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    itemTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

// --- Status History sub-schema (audit trail) ---
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    updatedBy: {
      type: String,
      enum: ['customer', 'seller', 'admin', 'system'],
      default: 'system',
    },
  },
  { _id: false }
);

// --- Main Order Schema ---
const orderSchema = new mongoose.Schema(
  {
    // --- Link to Customer account ---
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // --- Human-friendly order number ---
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // --- Order Items ---
    items: {
      type: [orderItemSchema],
      required: [true, 'At least one item is required'],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one item must be in the order',
      },
    },

    // --- Shipping Address (snapshot from customer's address) ---
    shippingAddress: {
      label: {
        type: String,
        trim: true,
        default: 'Home',
      },
      addressLine1: {
        type: String,
        required: [true, 'Shipping address line 1 is required'],
        trim: true,
      },
      addressLine2: {
        type: String,
        trim: true,
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

    // --- Payment ---
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['COD', 'card'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refund_initiated'],
      default: 'pending',
    },

    // --- Totals ---
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // --- Order Status ---
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },

    // --- Status Timeline (audit trail with timestamps) ---
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    // --- Cancellation ---
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },

    // --- Shipping / Tracking ---
    trackingNumber: {
      type: String,
      trim: true,
      default: '',
    },
    courierName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// -------------------------------------------------------
// Static method: generate a unique order number
// Format: CB-<timestamp>-<random4hex>
// Example: CB-1714500000000-A3F2
// -------------------------------------------------------
orderSchema.statics.generateOrderNumber = function () {
  const timestamp = Date.now();
  const random = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `CB-${timestamp}-${random}`;
};

// -------------------------------------------------------
// Indexes for faster queries
// NOTE: orderNumber already has a unique index from the field definition above
// -------------------------------------------------------
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ 'items.seller': 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
