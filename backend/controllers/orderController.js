const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

// -------------------------------------------------------
// Helper: extract validation errors (same pattern as other controllers)
// -------------------------------------------------------
const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
    return false;
  }
  return true;
};

// =======================================================
//  CUSTOMER ENDPOINTS
// =======================================================

// -------------------------------------------------------
// FR4.1 — POST /api/orders
// Customer places a new order
// -------------------------------------------------------
const placeOrder = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { items, shippingAddress, paymentMethod } = req.body;

    // --- Step 1: Validate each item, check stock, snapshot product data ---
    const orderItems = [];
    const stockUpdates = []; // track what to deduct after validation

    for (let i = 0; i < items.length; i++) {
      const { product: productId, size, color, quantity } = items[i];

      // Find the product (must be published and not deleted)
      const product = await Product.findOne({
        _id: productId,
        isPublished: true,
        isDeleted: false,
      }).populate('seller', 'shopName');

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found or unavailable (item ${i + 1}).`,
        });
      }

      // Find the matching variant (size + color)
      const variant = product.variants.find(
        (v) => v.size === size && v.color === color
      );

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Variant not found: size "${size}", color "${color}" for product "${product.name}" (item ${i + 1}).`,
        });
      }

      // Check stock availability
      if (variant.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}" (${size}/${color}). Available: ${variant.stock}, Requested: ${quantity}.`,
        });
      }

      // Calculate item total
      const itemTotal = product.price * quantity;

      // Snapshot product data into order item
      orderItems.push({
        product: product._id,
        seller: product.seller._id,
        productName: product.name,
        productImage: product.images && product.images.length > 0 ? product.images[0] : '',
        category: product.category,
        size,
        color,
        quantity,
        price: product.price,
        itemTotal,
      });

      // Queue stock deduction
      stockUpdates.push({
        productId: product._id,
        variantId: variant._id,
        quantity,
      });
    }

    // --- Step 2: Deduct stock for all items ---
    for (const update of stockUpdates) {
      const product = await Product.findById(update.productId);
      const variant = product.variants.id(update.variantId);
      variant.stock -= update.quantity;
      await product.save(); // pre-save hook recalculates totalStock
    }

    // --- Step 3: Calculate totals ---
    const subtotal = orderItems.reduce((sum, item) => sum + item.itemTotal, 0);
    const deliveryFee = 0; // Can be configured later
    const totalAmount = subtotal + deliveryFee;

    // --- Step 4: Generate unique order number ---
    const orderNumber = Order.generateOrderNumber();

    // --- Step 5: Determine payment status ---
    // Card: simulated as 'paid' immediately (real gateway integration later)
    // COD: payment is 'pending' until delivery
    const paymentStatus = paymentMethod === 'card' ? 'paid' : 'pending';

    // --- Step 6: Create the order ---
    const order = await Order.create({
      customer: req.user._id,
      orderNumber,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      subtotal,
      deliveryFee,
      totalAmount,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          note: 'Order placed successfully',
          updatedBy: 'customer',
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: `Order placed successfully! Your order number is ${orderNumber}.`,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR4.3 — GET /api/orders/my-orders
// Customer views their order history
// -------------------------------------------------------
const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { customer: req.user._id };

    // Optional status filter
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .select('orderNumber items status paymentMethod paymentStatus totalAmount createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    // Quick counts for status tabs
    const totalAll = await Order.countDocuments({ customer: req.user._id });
    const totalPending = await Order.countDocuments({ customer: req.user._id, status: 'pending' });
    const totalConfirmed = await Order.countDocuments({ customer: req.user._id, status: 'confirmed' });
    const totalShipped = await Order.countDocuments({ customer: req.user._id, status: 'shipped' });
    const totalDelivered = await Order.countDocuments({ customer: req.user._id, status: 'delivered' });
    const totalCancelled = await Order.countDocuments({ customer: req.user._id, status: 'cancelled' });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: {
        all: totalAll,
        pending: totalPending,
        confirmed: totalConfirmed,
        shipped: totalShipped,
        delivered: totalDelivered,
        cancelled: totalCancelled,
      },
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR4.4 — GET /api/orders/:id
// Customer views a specific order's full detail
// -------------------------------------------------------
const getOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    })
      .populate('items.product', 'name images')
      .populate('items.seller', 'shopName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR4.7 — PUT /api/orders/:id/cancel
// Customer cancels a pending order
// -------------------------------------------------------
const cancelOrder = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Customer can only cancel if status is 'pending'
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel this order. Current status: ${order.status}. Customers can only cancel orders with status "pending".`,
      });
    }

    // --- Restore stock for each item ---
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const variant = product.variants.find(
          (v) => v.size === item.size && v.color === item.color
        );
        if (variant) {
          variant.stock += item.quantity;
          await product.save(); // pre-save hook recalculates totalStock
        }
      }
    }

    // Update order status
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: `Cancelled by customer: ${reason}`,
      updatedBy: 'customer',
    });

    // If card payment, mark for refund
    if (order.paymentMethod === 'card' && order.paymentStatus === 'paid') {
      order.paymentStatus = 'refund_initiated';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully. Stock has been restored.',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        cancellationReason: order.cancellationReason,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
//  SELLER ENDPOINTS
// =======================================================

// -------------------------------------------------------
// FR4.3 — GET /api/orders/seller/my-orders
// Seller views orders containing their products
// -------------------------------------------------------
const getSellerOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const sellerId = req.seller._id;

    const filter = { 'items.seller': sellerId };

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('customer', 'fullName email phone')
      .select('orderNumber items customer status paymentMethod paymentStatus totalAmount shippingAddress createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    // Quick counts for seller's order tabs
    const totalAll = await Order.countDocuments({ 'items.seller': sellerId });
    const totalPending = await Order.countDocuments({ 'items.seller': sellerId, status: 'pending' });
    const totalConfirmed = await Order.countDocuments({ 'items.seller': sellerId, status: 'confirmed' });
    const totalShipped = await Order.countDocuments({ 'items.seller': sellerId, status: 'shipped' });
    const totalDelivered = await Order.countDocuments({ 'items.seller': sellerId, status: 'delivered' });
    const totalCancelled = await Order.countDocuments({ 'items.seller': sellerId, status: 'cancelled' });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: {
        all: totalAll,
        pending: totalPending,
        confirmed: totalConfirmed,
        shipped: totalShipped,
        delivered: totalDelivered,
        cancelled: totalCancelled,
      },
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR4.4 — GET /api/orders/seller/:id
// Seller views full detail of an order containing their products
// -------------------------------------------------------
const getSellerOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      'items.seller': req.seller._id,
    })
      .populate('customer', 'fullName email phone')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not contain your products.',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR4.6 — PUT /api/orders/seller/:id/confirm
// Seller confirms a pending order
// -------------------------------------------------------
const confirmOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      'items.seller': req.seller._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not contain your products.',
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm this order. Current status: ${order.status}. Only pending orders can be confirmed.`,
      });
    }

    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Order confirmed by seller. Preparing for shipment.',
      updatedBy: 'seller',
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order confirmed successfully. Please prepare it for shipment.',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusHistory: order.statusHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR4.6 — PUT /api/orders/seller/:id/ship
// Seller marks an order as shipped
// -------------------------------------------------------
const shipOrder = async (req, res, next) => {
  try {
    const { courierName, trackingNumber } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      'items.seller': req.seller._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not contain your products.',
      });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot ship this order. Current status: ${order.status}. Only confirmed orders can be shipped.`,
      });
    }

    order.status = 'shipped';
    order.courierName = courierName || '';
    order.trackingNumber = trackingNumber || '';

    const note = trackingNumber
      ? `Order shipped via ${courierName || 'courier'}. Tracking: ${trackingNumber}`
      : `Order shipped${courierName ? ` via ${courierName}` : ''}. No tracking number provided.`;

    order.statusHistory.push({
      status: 'shipped',
      timestamp: new Date(),
      note,
      updatedBy: 'seller',
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order marked as shipped. Customer has been notified.',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        statusHistory: order.statusHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
//  ADMIN ENDPOINTS
// =======================================================

// -------------------------------------------------------
// FR4.8 — GET /api/orders/admin/all
// Admin views all orders with filters
// -------------------------------------------------------
const getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentMethod, paymentStatus, search, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Search by order number
    if (search) {
      filter.orderNumber = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('customer', 'fullName email phone')
      .populate('items.seller', 'shopName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    // Platform-wide stats
    const totalAll = await Order.countDocuments({});
    const totalPending = await Order.countDocuments({ status: 'pending' });
    const totalConfirmed = await Order.countDocuments({ status: 'confirmed' });
    const totalShipped = await Order.countDocuments({ status: 'shipped' });
    const totalDelivered = await Order.countDocuments({ status: 'delivered' });
    const totalCancelled = await Order.countDocuments({ status: 'cancelled' });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: {
        all: totalAll,
        pending: totalPending,
        confirmed: totalConfirmed,
        shipped: totalShipped,
        delivered: totalDelivered,
        cancelled: totalCancelled,
      },
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR4.8 — GET /api/orders/admin/:id
// Admin views full detail of any order
// -------------------------------------------------------
const getAdminOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'fullName email phone')
      .populate('items.product', 'name images price')
      .populate('items.seller', 'shopName user');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR4.7 — PUT /api/orders/admin/:id/cancel
// Admin cancels an order (before shipped)
// -------------------------------------------------------
const adminCancelOrder = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Admin can cancel if status is 'pending' or 'confirmed' (NOT shipped/delivered)
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel this order. Current status: ${order.status}. Admin can only cancel orders before they are shipped.`,
      });
    }

    // --- Restore stock for each item ---
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const variant = product.variants.find(
          (v) => v.size === item.size && v.color === item.color
        );
        if (variant) {
          variant.stock += item.quantity;
          await product.save(); // pre-save hook recalculates totalStock
        }
      }
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: `Cancelled by admin: ${reason}`,
      updatedBy: 'admin',
    });

    // If card payment was made, mark for refund
    if (order.paymentMethod === 'card' && order.paymentStatus === 'paid') {
      order.paymentStatus = 'refund_initiated';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled by admin. Stock has been restored. Seller and customer will be notified.',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        cancellationReason: order.cancellationReason,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR4.5 — PUT /api/orders/:id/confirm-delivery
// Customer confirms receipt of a shipped order
// This replaces the old admin-driven delivery confirmation.
// -------------------------------------------------------
const confirmDelivery = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm delivery. Current status: ${order.status}. Only shipped orders can be confirmed as delivered.`,
      });
    }

    order.status = 'delivered';
    order.statusHistory.push({
      status: 'delivered',
      timestamp: new Date(),
      note: 'Delivery confirmed by customer.',
      updatedBy: 'customer',
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Thank you! Your delivery has been confirmed. You can now leave a review.',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        statusHistory: order.statusHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR4.5 — PUT /api/orders/admin/:id/deliver  [DEPRECATED]
// Delivery is now confirmed by the customer, not the admin.
// This endpoint is kept as a stub to avoid breaking routes
// but returns a 403 directing to the correct flow.
// -------------------------------------------------------
const adminMarkDelivered = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Delivery confirmation has been moved to the customer. Customers confirm receipt from their Order Details screen.',
  });
};

module.exports = {
  // Customer
  placeOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  confirmDelivery,
  // Seller
  getSellerOrders,
  getSellerOrderDetail,
  confirmOrder,
  shipOrder,
  // Admin
  getAllOrders,
  getAdminOrderDetail,
  adminCancelOrder,
  adminMarkDelivered, // deprecated stub
};
