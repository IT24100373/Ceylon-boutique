const { body, param } = require('express-validator');

// -------------------------------------------------------
// FR1.1 — Customer Registration
// -------------------------------------------------------
const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 100 }).withMessage('Full name cannot exceed 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+94|0)[0-9]{9}$/).withMessage('Please provide a valid Sri Lankan phone number (e.g. 0771234567)'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

// -------------------------------------------------------
// FR1.2 — Login
// -------------------------------------------------------
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// -------------------------------------------------------
// FR1.4 — Update Profile
// -------------------------------------------------------
const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .notEmpty().withMessage('Full name cannot be empty')
    .isLength({ max: 100 }).withMessage('Full name cannot exceed 100 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^(\+94|0)[0-9]{9}$/).withMessage('Please provide a valid Sri Lankan phone number'),
];

// -------------------------------------------------------
// FR1.5 — Change Password
// -------------------------------------------------------
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('confirmNewPassword')
    .notEmpty().withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New passwords do not match');
      }
      return true;
    }),
];

// -------------------------------------------------------
// FR1.6 — Address Operations
// -------------------------------------------------------
const addressValidation = [
  body('label')
    .optional()
    .trim()
    .isLength({ max: 30 }).withMessage('Label cannot exceed 30 characters'),

  body('addressLine1')
    .trim()
    .notEmpty().withMessage('Address line 1 is required')
    .isLength({ max: 200 }).withMessage('Address line 1 cannot exceed 200 characters'),

  body('addressLine2')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Address line 2 cannot exceed 200 characters'),

  body('city')
    .trim()
    .notEmpty().withMessage('City is required'),

  body('province')
    .trim()
    .notEmpty().withMessage('Province is required')
    .isIn([
      'Western', 'Central', 'Southern', 'Northern', 'Eastern',
      'North Western', 'North Central', 'Uva', 'Sabaragamuwa',
    ]).withMessage('Please select a valid Sri Lankan province'),

  body('postalCode')
    .trim()
    .notEmpty().withMessage('Postal code is required')
    .matches(/^[0-9]{5}$/).withMessage('Please enter a valid 5-digit postal code'),
];

const addressIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid address ID'),
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  addressValidation,
  addressIdValidation,
};
