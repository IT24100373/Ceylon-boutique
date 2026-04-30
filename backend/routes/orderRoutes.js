const express = require('express');
const router = express.Router();

const {
  placeOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  getSellerOrders,
  getSellerOrderDetail,
  confirmOrder,
  shipOrder,
  getAllOrders,
  getAdminOrderDetail,
  adminCancelOrder,
  adminMarkDelivered,
} = require('../controllers/orderController');

const { protect, authorize, requireVerifiedSeller } = require('../middleware/auth');

const {
  placeOrderValidation,
  cancelOrderValidation,
  shipOrderValidation,
  orderIdValidation,
} = require('../utils/validators');

// -------------------------------------------------------
// Customer routes (JWT token required)
// NOTE: Named routes must come BEFORE /:id to avoid conflicts
// -------------------------------------------------------

// FR4.3 — View own order history
router.get('/my-orders', protect, getMyOrders);

// FR4.1 — Place a new order
router.post('/', protect, placeOrderValidation, placeOrder);

// FR4.7 — Cancel a pending order
router.put('/:id/cancel', protect, orderIdValidation, cancelOrderValidation, cancelOrder);

// -------------------------------------------------------
// Seller routes (JWT + verified seller)
// NOTE: /seller/* must come BEFORE /:id to avoid conflicts
// -------------------------------------------------------

// FR4.3 — View incoming orders for seller's products
router.get('/seller/my-orders', protect, requireVerifiedSeller, getSellerOrders);

// FR4.4 — View full detail of a specific order
router.get('/seller/:id', protect, requireVerifiedSeller, orderIdValidation, getSellerOrderDetail);

// FR4.6 — Confirm a pending order
router.put('/seller/:id/confirm', protect, requireVerifiedSeller, orderIdValidation, confirmOrder);

// FR4.6 — Mark an order as shipped
router.put('/seller/:id/ship', protect, requireVerifiedSeller, orderIdValidation, shipOrderValidation, shipOrder);

// -------------------------------------------------------
// Admin routes (JWT + admin role)
// NOTE: /admin/* must come BEFORE /:id to avoid conflicts
// -------------------------------------------------------

// FR4.8 — List all orders with filters
router.get('/admin/all', protect, authorize('admin'), getAllOrders);

// FR4.8 — View full detail of any order
router.get('/admin/:id', protect, authorize('admin'), orderIdValidation, getAdminOrderDetail);

// FR4.7 — Admin cancels an order (before shipped)
router.put('/admin/:id/cancel', protect, authorize('admin'), orderIdValidation, cancelOrderValidation, adminCancelOrder);

// FR4.5 — Admin marks an order as delivered
router.put('/admin/:id/deliver', protect, authorize('admin'), orderIdValidation, adminMarkDelivered);

// -------------------------------------------------------
// Customer order detail — MUST BE LAST to avoid catching
// /my-orders, /seller/*, /admin/* routes above
// -------------------------------------------------------

// FR4.4 — View a specific order's full detail
router.get('/:id', protect, orderIdValidation, getOrderDetail);

module.exports = router;
