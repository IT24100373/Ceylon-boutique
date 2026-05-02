const express = require('express');
const router = express.Router();

const {
  submitReview,
  getProductReviews,
  getSellerReviews,
  getSellerProductReviews,
  getMyReviews,
  getOrderReviewStatus,
  editReview,
  deleteReview,
  markHelpful,
  adminGetAllReviews,
  adminRemoveReview,
} = require('../controllers/reviewController');

const { protect, authorize } = require('../middleware/auth');

const {
  submitReviewValidation,
  editReviewValidation,
  reviewIdValidation,
  adminRemoveReviewValidation,
} = require('../utils/validators');

// -------------------------------------------------------
// Customer routes (JWT required)
// NOTE: Named routes BEFORE /:id to avoid conflicts
// -------------------------------------------------------

// FR5.1 — Submit a review (product or seller)
router.post('/', protect, authorize('customer'), submitReviewValidation, submitReview);

// View own reviews
router.get('/my-reviews', protect, authorize('customer'), getMyReviews);

// Get review status for a specific order (which items have been reviewed)
router.get('/order/:orderId/status', protect, authorize('customer'), getOrderReviewStatus);

// FR5.4 — Edit a review (within 72 hours)
router.put('/:id', protect, authorize('customer'), reviewIdValidation, editReviewValidation, editReview);

// FR5.5 — Delete own review
router.delete('/:id', protect, authorize('customer'), reviewIdValidation, deleteReview);

// Mark a review as helpful (any authenticated user)
router.put('/:id/helpful', protect, reviewIdValidation, markHelpful);

// -------------------------------------------------------
// Public routes (any authenticated user — customer or seller)
// NOTE: /product/* and /seller/* BEFORE /:id
// -------------------------------------------------------

// FR5.2 — View product reviews (paginated + sorted)
router.get('/product/:productId', protect, getProductReviews);

// FR5.3 — View seller reviews (paginated + sorted)
router.get('/seller/:sellerId', protect, getSellerReviews);

// View all product reviews belonging to a seller
router.get('/seller/:sellerId/products', protect, getSellerProductReviews);

// -------------------------------------------------------
// Admin routes (JWT + admin role)
// NOTE: /admin/* BEFORE /:id
// -------------------------------------------------------

// FR5.6 — List all reviews with filters
router.get('/admin/all', protect, authorize('admin'), adminGetAllReviews);

// FR5.6 — Remove a policy-violating review
router.put('/admin/:id/remove', protect, authorize('admin'), reviewIdValidation, adminRemoveReviewValidation, adminRemoveReview);

module.exports = router;
