const express = require('express');
const router = express.Router();

const {
  registerSeller,
  loginSeller,
  getMyShop,
  getShopPublic,
  getSellerDashboard,
  updateShopInfo,
  updateDocuments,
  getAllSellers,
  getSellerDetails,
  verifySeller,
  suspendSeller,
  removeSeller,
} = require('../controllers/sellerController');

const { protect, authorize, requireVerifiedSeller } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const {
  sellerRegisterValidation,
  sellerLoginValidation,
  updateShopValidation,
  updateDocumentsValidation,
  sellerIdValidation,
  verifySellerValidation,
} = require('../utils/validators');

// -------------------------------------------------------
// Public routes (no token required)
// -------------------------------------------------------

// FR2.1 — Seller Registration
router.post('/register', sellerRegisterValidation, registerSeller);

// FR2.1 — Seller Login (with IP-based rate limiter)
router.post('/login', loginLimiter, sellerLoginValidation, loginSeller);

// FR2.3 — Public Shop Profile (anyone can view an approved shop)
router.get('/shop/:id', sellerIdValidation, getShopPublic);

// -------------------------------------------------------
// Protected routes — Seller only (JWT token required)
// -------------------------------------------------------

// FR2.3 — View own shop profile
router.get('/my-shop', protect, authorize('seller'), getMyShop);

// FR2.3 — Seller dashboard
router.get('/dashboard', protect, authorize('seller'), getSellerDashboard);

// FR2.4 — Edit shop info (verified sellers only)
router.put(
  '/my-shop',
  protect,
  requireVerifiedSeller,
  updateShopValidation,
  updateShopInfo
);

// FR2.5 — Update business documents (verified sellers only)
router.put(
  '/my-shop/documents',
  protect,
  requireVerifiedSeller,
  updateDocumentsValidation,
  updateDocuments
);

// -------------------------------------------------------
// Protected routes — Admin only
// -------------------------------------------------------

// FR6.4 — List all sellers (with filters)
router.get('/admin/all', protect, authorize('admin'), getAllSellers);

// FR6.4 — Get full seller details
router.get('/admin/:id', protect, authorize('admin'), sellerIdValidation, getSellerDetails);

// FR2.2 — Approve or reject a seller
router.put(
  '/admin/:id/verify',
  protect,
  authorize('admin'),
  sellerIdValidation,
  verifySellerValidation,
  verifySeller
);

// FR2.6 — Suspend a seller
router.put(
  '/admin/:id/suspend',
  protect,
  authorize('admin'),
  sellerIdValidation,
  suspendSeller
);

// FR2.6 — Remove a seller permanently
router.put(
  '/admin/:id/remove',
  protect,
  authorize('admin'),
  sellerIdValidation,
  removeSeller
);

module.exports = router;
