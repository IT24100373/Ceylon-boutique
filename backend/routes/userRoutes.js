const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  deactivateAccount,
} = require('../controllers/userController');

const { protect } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  addressValidation,
  addressIdValidation,
} = require('../utils/validators');

// -------------------------------------------------------
// Public routes (no token required)
// -------------------------------------------------------
// FR1.1 — Register
router.post('/register', registerValidation, register);

// FR1.2 — Login (with IP-based rate limiter)
router.post('/login', loginLimiter, loginValidation, login);

// -------------------------------------------------------
// Protected routes (JWT token required)
// -------------------------------------------------------

// FR1.3 — Get profile
router.get('/profile', protect, getProfile);

// FR1.4 — Update profile (name + phone only)
router.put('/profile', protect, updateProfileValidation, updateProfile);

// FR1.5 — Change password
router.put('/change-password', protect, changePasswordValidation, changePassword);

// FR1.6 — Address management
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addressValidation, addAddress);
router.put('/addresses/:id', protect, addressIdValidation, addressValidation, updateAddress);
router.delete('/addresses/:id', protect, addressIdValidation, deleteAddress);
router.put('/addresses/:id/default', protect, addressIdValidation, setDefaultAddress);

// FR1.7 — Deactivate account
router.put('/deactivate', protect, deactivateAccount);

module.exports = router;
