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

// -------------------------------------------------------
// FR2.1 — Seller Registration
// -------------------------------------------------------
const sellerRegisterValidation = [
  // Step 1: Personal details
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
    .matches(/^(\+94|0)[0-9]{9}$/).withMessage('Please provide a valid Sri Lankan phone number'),

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

  // Step 2: Shop details
  body('shopName')
    .trim()
    .notEmpty().withMessage('Shop name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Shop name must be between 3 and 100 characters'),

  body('shopDescription')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Shop description cannot exceed 1000 characters'),

  body('categoryFocus')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category focus cannot exceed 100 characters'),

  // Step 3: Business documents
  body('businessRegNumber')
    .trim()
    .notEmpty().withMessage('Business registration number is required'),

  body('nicNumber')
    .trim()
    .notEmpty().withMessage('NIC number is required')
    .matches(/^([0-9]{9}[vVxX]|[0-9]{12})$/).withMessage('Please enter a valid Sri Lankan NIC number'),

  body('documentsUrl')
    .optional()
    .trim(),

  // Step 4: Bank details
  body('bankName')
    .trim()
    .notEmpty().withMessage('Bank name is required'),

  body('bankBranch')
    .trim()
    .notEmpty().withMessage('Bank branch is required'),

  body('bankAccountNumber')
    .trim()
    .notEmpty().withMessage('Bank account number is required'),

  body('bankAccountName')
    .trim()
    .notEmpty().withMessage('Bank account holder name is required'),

  // Contact address
  body('contactAddress.addressLine1')
    .trim()
    .notEmpty().withMessage('Contact address line 1 is required')
    .isLength({ max: 200 }).withMessage('Address line 1 cannot exceed 200 characters'),

  body('contactAddress.addressLine2')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Address line 2 cannot exceed 200 characters'),

  body('contactAddress.city')
    .trim()
    .notEmpty().withMessage('City is required'),

  body('contactAddress.province')
    .trim()
    .notEmpty().withMessage('Province is required')
    .isIn([
      'Western', 'Central', 'Southern', 'Northern', 'Eastern',
      'North Western', 'North Central', 'Uva', 'Sabaragamuwa',
    ]).withMessage('Please select a valid Sri Lankan province'),

  body('contactAddress.postalCode')
    .trim()
    .notEmpty().withMessage('Postal code is required')
    .matches(/^[0-9]{5}$/).withMessage('Please enter a valid 5-digit postal code'),
];

// -------------------------------------------------------
// FR2.1 — Seller Login
// -------------------------------------------------------
const sellerLoginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// -------------------------------------------------------
// FR2.4 — Update Shop Info
// -------------------------------------------------------
const updateShopValidation = [
  body('shopName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Shop name must be between 3 and 100 characters'),

  body('shopDescription')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Shop description cannot exceed 1000 characters'),

  body('shopLogo')
    .optional()
    .trim(),

  body('shopBanner')
    .optional()
    .trim(),

  body('categoryFocus')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category focus cannot exceed 100 characters'),
];

// -------------------------------------------------------
// FR2.5 — Update Business Documents
// -------------------------------------------------------
const updateDocumentsValidation = [
  body('businessRegNumber')
    .optional()
    .trim()
    .notEmpty().withMessage('Business registration number cannot be empty'),

  body('nicNumber')
    .optional()
    .trim()
    .matches(/^([0-9]{9}[vVxX]|[0-9]{12})$/).withMessage('Please enter a valid Sri Lankan NIC number'),

  body('documentsUrl')
    .optional()
    .trim(),
];

// -------------------------------------------------------
// Module 2 — Seller ID param validation
// -------------------------------------------------------
const sellerIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid seller ID'),
];

// -------------------------------------------------------
// FR2.2 — Admin Verify Seller
// -------------------------------------------------------
const verifySellerValidation = [
  body('status')
    .notEmpty().withMessage('Verification status is required')
    .isIn(['approved', 'rejected']).withMessage('Status must be either "approved" or "rejected"'),

  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Rejection reason cannot exceed 500 characters'),
];

// -------------------------------------------------------
// FR3.1 — Add New Product
// -------------------------------------------------------
const addProductValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Product name must be between 3 and 200 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Product description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('category')
    .trim()
    .notEmpty().withMessage('Product category is required')
    .isIn([
      'Saree & Traditional', 'Dresses', 'Tops & Blouses', 'Pants & Trousers',
      'Skirts', "Men's Shirts", "Men's Trousers", 'Kids Wear',
      'Accessories', 'Footwear', 'Other',
    ]).withMessage('Please select a valid product category'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 1 }).withMessage('Price must be at least LKR 1'),

  body('sizes')
    .isArray({ min: 1 }).withMessage('At least one size is required'),

  body('sizes.*')
    .trim()
    .notEmpty().withMessage('Size value cannot be empty'),

  body('images')
    .isArray({ min: 1, max: 10 }).withMessage('Between 1 and 10 images are required'),

  body('images.*')
    .trim()
    .notEmpty().withMessage('Image URL cannot be empty'),

  body('variants')
    .isArray({ min: 1 }).withMessage('At least one variant (size/color/stock) is required'),

  body('variants.*.size')
    .trim()
    .notEmpty().withMessage('Variant size is required'),

  body('variants.*.color')
    .trim()
    .notEmpty().withMessage('Variant color is required'),

  body('variants.*.stock')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

// -------------------------------------------------------
// FR3.4 — Update Product Info
// -------------------------------------------------------
const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Product name must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('category')
    .optional()
    .trim()
    .isIn([
      'Saree & Traditional', 'Dresses', 'Tops & Blouses', 'Pants & Trousers',
      'Skirts', "Men's Shirts", "Men's Trousers", 'Kids Wear',
      'Accessories', 'Footwear', 'Other',
    ]).withMessage('Please select a valid product category'),

  body('price')
    .optional()
    .isFloat({ min: 1 }).withMessage('Price must be at least LKR 1'),

  body('sizes')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one size is required'),

  body('images')
    .optional()
    .isArray({ min: 1, max: 10 }).withMessage('Between 1 and 10 images are required'),
];

// -------------------------------------------------------
// FR3.5 — Update Stock
// -------------------------------------------------------
const updateStockValidation = [
  body('variants')
    .isArray({ min: 1 }).withMessage('At least one variant is required'),

  body('variants.*.size')
    .trim()
    .notEmpty().withMessage('Variant size is required'),

  body('variants.*.color')
    .trim()
    .notEmpty().withMessage('Variant color is required'),

  body('variants.*.stock')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

// -------------------------------------------------------
// Module 3 — Product ID param validation
// -------------------------------------------------------
const productIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid product ID'),
];

// -------------------------------------------------------
// FR4.1 — Place Order
// -------------------------------------------------------
const placeOrderValidation = [
  body('items')
    .isArray({ min: 1 }).withMessage('At least one item is required'),

  body('items.*.product')
    .notEmpty().withMessage('Product ID is required for each item')
    .isMongoId().withMessage('Invalid product ID'),

  body('items.*.size')
    .trim()
    .notEmpty().withMessage('Size is required for each item'),

  body('items.*.color')
    .trim()
    .notEmpty().withMessage('Color is required for each item'),

  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),

  body('shippingAddress')
    .notEmpty().withMessage('Shipping address is required'),

  body('shippingAddress.addressLine1')
    .trim()
    .notEmpty().withMessage('Shipping address line 1 is required')
    .isLength({ max: 200 }).withMessage('Address line 1 cannot exceed 200 characters'),

  body('shippingAddress.addressLine2')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Address line 2 cannot exceed 200 characters'),

  body('shippingAddress.city')
    .trim()
    .notEmpty().withMessage('City is required'),

  body('shippingAddress.province')
    .trim()
    .notEmpty().withMessage('Province is required')
    .isIn([
      'Western', 'Central', 'Southern', 'Northern', 'Eastern',
      'North Western', 'North Central', 'Uva', 'Sabaragamuwa',
    ]).withMessage('Please select a valid Sri Lankan province'),

  body('shippingAddress.postalCode')
    .trim()
    .notEmpty().withMessage('Postal code is required')
    .matches(/^[0-9]{5}$/).withMessage('Please enter a valid 5-digit postal code'),

  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['card']).withMessage('Only card payment is accepted.'),
];

// -------------------------------------------------------
// FR4.7 — Cancel Order (Customer or Admin)
// -------------------------------------------------------
const cancelOrderValidation = [
  body('reason')
    .trim()
    .notEmpty().withMessage('Cancellation reason is required')
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
];

// -------------------------------------------------------
// FR4.6 — Ship Order (Seller)
// -------------------------------------------------------
const shipOrderValidation = [
  body('courierName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Courier name cannot exceed 100 characters'),

  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Tracking number cannot exceed 100 characters'),
];

// -------------------------------------------------------
// Module 4 — Order ID param validation
// -------------------------------------------------------
const orderIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid order ID'),
];

// -------------------------------------------------------
// FR5.1 — Submit Review
// -------------------------------------------------------
const submitReviewValidation = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID'),

  body('orderItemId')
    .notEmpty().withMessage('Order item ID is required')
    .trim(),

  body('reviewType')
    .notEmpty().withMessage('Review type is required')
    .isIn(['product', 'seller']).withMessage('Review type must be "product" or "seller"'),

  body('productId')
    .optional()
    .isMongoId().withMessage('Invalid product ID'),

  body('sellerId')
    .optional()
    .isMongoId().withMessage('Invalid seller ID'),

  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('reviewText')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Review text cannot exceed 1000 characters'),

  body('photos')
    .optional()
    .isArray({ max: 3 }).withMessage('Maximum 3 photos allowed'),

  body('photos.*')
    .optional()
    .trim()
    .notEmpty().withMessage('Photo URL cannot be empty'),
];

// -------------------------------------------------------
// FR5.4 — Edit Review
// -------------------------------------------------------
const editReviewValidation = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('reviewText')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Review text cannot exceed 1000 characters'),

  body('photos')
    .optional()
    .isArray({ max: 3 }).withMessage('Maximum 3 photos allowed'),
];

// -------------------------------------------------------
// Module 5 — Review ID param validation
// -------------------------------------------------------
const reviewIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid review ID'),
];

// -------------------------------------------------------
// FR5.6 — Admin Remove Review
// -------------------------------------------------------
const adminRemoveReviewValidation = [
  body('reason')
    .trim()
    .notEmpty().withMessage('Removal reason is required')
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
];

// -------------------------------------------------------
// FR6.1 — Admin Login
// -------------------------------------------------------
const adminLoginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// -------------------------------------------------------
// FR6.1 — Create Admin Account
// -------------------------------------------------------
const createAdminValidation = [
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
    .matches(/^(\+94|0)[0-9]{9}$/).withMessage('Please provide a valid Sri Lankan phone number'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

// -------------------------------------------------------
// FR6.3 — Customer ID param validation
// -------------------------------------------------------
const customerIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid customer ID'),
];

// -------------------------------------------------------
// FR6.10 — Category Validation
// -------------------------------------------------------
const categoryValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Category name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters'),

  body('icon')
    .optional()
    .trim(),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
];

const categoryIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid category ID'),
];

// -------------------------------------------------------
// FR6.7 — Record Payout Validation
// -------------------------------------------------------
const payoutValidation = [
  body('sellerId')
    .notEmpty().withMessage('Seller ID is required')
    .isMongoId().withMessage('Invalid seller ID'),

  body('amount')
    .notEmpty().withMessage('Payout amount is required')
    .isFloat({ min: 1 }).withMessage('Payout amount must be at least LKR 1'),

  body('method')
    .optional()
    .isIn(['bank_transfer', 'cash', 'other']).withMessage('Invalid payout method'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

module.exports = {
  // Module 1
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  addressValidation,
  addressIdValidation,
  // Module 2
  sellerRegisterValidation,
  sellerLoginValidation,
  updateShopValidation,
  updateDocumentsValidation,
  sellerIdValidation,
  verifySellerValidation,
  // Module 3
  addProductValidation,
  updateProductValidation,
  updateStockValidation,
  productIdValidation,
  // Module 4
  placeOrderValidation,
  cancelOrderValidation,
  shipOrderValidation,
  orderIdValidation,
  // Module 5
  submitReviewValidation,
  editReviewValidation,
  reviewIdValidation,
  adminRemoveReviewValidation,
  // Module 6
  adminLoginValidation,
  createAdminValidation,
  customerIdValidation,
  categoryValidation,
  categoryIdValidation,
  payoutValidation,
};

