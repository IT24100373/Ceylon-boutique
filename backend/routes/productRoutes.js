const express = require('express');
const router = express.Router();

const {
  addProduct,
  getProducts,
  getProductById,
  getProductsByShop,
  getMyProducts,
  updateProduct,
  updateStock,
  unpublishProduct,
  republishProduct,
  deleteProduct,
  adminUnpublishProduct,
} = require('../controllers/productController');

const { protect, authorize, requireVerifiedSeller } = require('../middleware/auth');

const {
  addProductValidation,
  updateProductValidation,
  updateStockValidation,
  productIdValidation,
} = require('../utils/validators');

// -------------------------------------------------------
// Public routes (JWT required — any authenticated user)
// -------------------------------------------------------

// FR3.2 — Browse, search, and filter products
router.get('/', protect, getProducts);

// FR3.2 — Get products by shop
// NOTE: This must come BEFORE /:id to avoid route conflicts
router.get('/shop/:sellerId', protect, getProductsByShop);

// -------------------------------------------------------
// Seller routes (JWT + verified seller)
// NOTE: /seller/* routes must come BEFORE /:id to avoid conflicts
// -------------------------------------------------------

// FR3.4 — View own products list
router.get('/seller/my-products', protect, requireVerifiedSeller, getMyProducts);

// FR3.1 — Add new product
router.post(
  '/',
  protect,
  requireVerifiedSeller,
  addProductValidation,
  addProduct
);

// FR3.4 — Edit product info
router.put(
  '/:id',
  protect,
  requireVerifiedSeller,
  productIdValidation,
  updateProductValidation,
  updateProduct
);

// FR3.5 — Update stock levels
router.put(
  '/:id/stock',
  protect,
  requireVerifiedSeller,
  productIdValidation,
  updateStockValidation,
  updateStock
);

// FR3.6 — Unpublish product (seller)
router.put(
  '/:id/unpublish',
  protect,
  requireVerifiedSeller,
  productIdValidation,
  unpublishProduct
);

// FR3.6 — Republish product (seller)
router.put(
  '/:id/republish',
  protect,
  requireVerifiedSeller,
  productIdValidation,
  republishProduct
);

// FR3.6 — Delete product (soft delete)
router.delete(
  '/:id',
  protect,
  requireVerifiedSeller,
  productIdValidation,
  deleteProduct
);

// -------------------------------------------------------
// Admin routes (JWT + admin role)
// -------------------------------------------------------

// FR3.6 — Admin force-unpublish any product
router.put(
  '/admin/:id/unpublish',
  protect,
  authorize('admin'),
  productIdValidation,
  adminUnpublishProduct
);

// -------------------------------------------------------
// Public product detail (must be LAST to avoid catching other routes)
// -------------------------------------------------------

// FR3.3 — View product detail page
router.get('/:id', protect, productIdValidation, getProductById);

module.exports = router;
