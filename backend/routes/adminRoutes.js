const express = require('express');
const router = express.Router();

const {
  adminLogin,
  getAdminProfile,
  getDashboardStats,
  getAllCustomers,
  getCustomerDetail,
  toggleCustomerStatus,
  getAllAdmins,
  createAdmin,
  getCategories,
  addCategory,
  updateCategory,
  getFinancialSummary,
  getSellerPayouts,
  recordPayout,
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const {
  adminLoginValidation,
  createAdminValidation,
  customerIdValidation,
  categoryValidation,
  categoryIdValidation,
  payoutValidation,
} = require('../utils/validators');

// -------------------------------------------------------
// Public routes (no token required)
// -------------------------------------------------------

// FR6.1 — Admin Login (with rate limiter)
router.post('/login', loginLimiter, adminLoginValidation, adminLogin);

// -------------------------------------------------------
// Protected routes — Admin only (JWT + role: admin)
// -------------------------------------------------------

// FR6.1 — Admin Profile
router.get('/profile', protect, authorize('admin'), getAdminProfile);

// FR6.9 — Analytics Dashboard
router.get('/dashboard', protect, authorize('admin'), getDashboardStats);

// FR6.3 — Customer Management
router.get('/customers', protect, authorize('admin'), getAllCustomers);
router.get('/customers/:id', protect, authorize('admin'), customerIdValidation, getCustomerDetail);
router.put('/customers/:id/status', protect, authorize('admin'), customerIdValidation, toggleCustomerStatus);

// FR6.1 — Admin Account Management
router.get('/accounts', protect, authorize('admin'), getAllAdmins);
router.post('/accounts', protect, authorize('admin'), createAdminValidation, createAdmin);

// FR6.10 — Category Management
router.get('/categories', protect, authorize('admin'), getCategories);
router.post('/categories', protect, authorize('admin'), categoryValidation, addCategory);
router.put('/categories/:id', protect, authorize('admin'), categoryIdValidation, categoryValidation, updateCategory);

// FR6.7 — Financial Operations
router.get('/financials', protect, authorize('admin'), getFinancialSummary);
router.get('/financials/payouts', protect, authorize('admin'), getSellerPayouts);
router.post('/financials/payouts', protect, authorize('admin'), payoutValidation, recordPayout);

module.exports = router;
