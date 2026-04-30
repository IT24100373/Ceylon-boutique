const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Category = require('../models/Category');
const Payout = require('../models/Payout');

// -------------------------------------------------------
// Helpers (same pattern as other controllers)
// -------------------------------------------------------
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

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
//  ADMIN AUTHENTICATION
// =======================================================

// -------------------------------------------------------
// FR6.1 — POST /api/admin/login
// Admin-only login (separate from customer/seller login)
// -------------------------------------------------------
const adminLogin = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Must be an admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This login is for admin accounts only.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your admin account has been deactivated.',
      });
    }

    // Check account lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
        await user.save();
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 15 minutes.',
        });
      }
      await user.save();
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${5 - user.loginAttempts} attempt(s) remaining.`,
      });
    }

    // Successful login — reset counters
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR6.1 — GET /api/admin/profile
// -------------------------------------------------------
const getAdminProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
//  ANALYTICS DASHBOARD (FR6.9)
// =======================================================

// -------------------------------------------------------
// GET /api/admin/dashboard
// -------------------------------------------------------
const getDashboardStats = async (req, res, next) => {
  try {
    // --- Quick counts ---
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalSellers = await Seller.countDocuments({});
    const pendingSellers = await Seller.countDocuments({ verificationStatus: 'pending' });
    const approvedSellers = await Seller.countDocuments({ verificationStatus: 'approved' });
    const totalProducts = await Product.countDocuments({ isDeleted: false });
    const totalOrders = await Order.countDocuments({});
    const totalReviews = await Review.countDocuments({ isDeleted: false, adminRemoved: false });
    const flaggedReviews = await Review.countDocuments({ adminRemoved: true });

    // --- Order status breakdown ---
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    // --- Revenue calculations ---
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // --- Payment method breakdown ---
    const codOrders = await Order.countDocuments({ paymentMethod: 'COD' });
    const cardOrders = await Order.countDocuments({ paymentMethod: 'card' });

    // --- Revenue by payment method ---
    const codRevenue = await Order.aggregate([
      { $match: { status: 'delivered', paymentMethod: 'COD' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const cardRevenue = await Order.aggregate([
      { $match: { status: 'delivered', paymentMethod: 'card' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    // --- Monthly revenue trend (last 6 months) ---
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // --- Category breakdown ---
    const categoryBreakdown = await Product.aggregate([
      { $match: { isDeleted: false, isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // --- Recent orders (last 5) ---
    const recentOrders = await Order.find({})
      .populate('customer', 'fullName email')
      .select('orderNumber status totalAmount paymentMethod createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // --- Top sellers by revenue ---
    const topSellers = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.seller',
          totalRevenue: { $sum: '$items.itemTotal' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'sellers',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo',
        },
      },
      { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          sellerId: '$_id',
          shopName: '$sellerInfo.shopName',
          totalRevenue: 1,
          orderCount: 1,
        },
      },
    ]);

    // --- Platform commission ---
    const commissionRate = parseInt(process.env.PLATFORM_COMMISSION_RATE) || 10;
    const platformCommission = Math.round(totalRevenue * (commissionRate / 100));
    const netPayable = totalRevenue - platformCommission;

    // --- Total payouts processed ---
    const payoutResult = await Payout.aggregate([
      { $match: { status: 'processed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalPayoutsProcessed = payoutResult.length > 0 ? payoutResult[0].total : 0;

    res.status(200).json({
      success: true,
      dashboard: {
        users: {
          totalCustomers,
          totalSellers,
          pendingSellers,
          approvedSellers,
        },
        products: {
          total: totalProducts,
          categoryBreakdown,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          confirmed: confirmedOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          paymentSplit: {
            cod: codOrders,
            card: cardOrders,
          },
        },
        revenue: {
          total: totalRevenue,
          cod: codRevenue.length > 0 ? codRevenue[0].total : 0,
          card: cardRevenue.length > 0 ? cardRevenue[0].total : 0,
          commissionRate,
          platformCommission,
          netPayable,
          totalPayoutsProcessed,
          outstandingBalance: netPayable - totalPayoutsProcessed,
        },
        reviews: {
          total: totalReviews,
          flagged: flaggedReviews,
        },
        trends: {
          monthlyRevenue,
        },
        recentOrders,
        topSellers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
//  CUSTOMER MANAGEMENT (FR6.3)
// =======================================================

// -------------------------------------------------------
// GET /api/admin/customers
// -------------------------------------------------------
const getAllCustomers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = { role: 'customer' };

    if (status === 'active') filter.isActive = true;
    if (status === 'deactivated') filter.isActive = false;

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const customers = await User.find(filter)
      .select('fullName email phone isActive createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    // Enrich with order count for each customer
    const enrichedCustomers = await Promise.all(
      customers.map(async (c) => {
        const orderCount = await Order.countDocuments({ customer: c._id });
        return {
          id: c._id,
          fullName: c.fullName,
          email: c.email,
          phone: c.phone,
          isActive: c.isActive,
          orderCount,
          createdAt: c.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedCustomers.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      customers: enrichedCustomers,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// GET /api/admin/customers/:id
// -------------------------------------------------------
const getCustomerDetail = async (req, res, next) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      role: 'customer',
    }).select('fullName email phone isActive createdAt updatedAt');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Get customer's orders
    const orders = await Order.find({ customer: customer._id })
      .select('orderNumber status totalAmount paymentMethod createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    const orderCount = await Order.countDocuments({ customer: customer._id });

    // Get total spent
    const spentResult = await Order.aggregate([
      { $match: { customer: customer._id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalSpent = spentResult.length > 0 ? spentResult[0].total : 0;

    // Get review count
    const reviewCount = await Review.countDocuments({
      customer: customer._id,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        stats: {
          totalOrders: orderCount,
          totalSpent,
          totalReviews: reviewCount,
        },
      },
      recentOrders: orders,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// PUT /api/admin/customers/:id/status
// -------------------------------------------------------
const toggleCustomerStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const customer = await User.findOne({
      _id: req.params.id,
      role: 'customer',
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    customer.isActive = isActive;
    await customer.save();

    res.status(200).json({
      success: true,
      message: `Customer account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        isActive: customer.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
//  ADMIN ACCOUNT MANAGEMENT (FR6.1)
// =======================================================

// -------------------------------------------------------
// GET /api/admin/accounts
// -------------------------------------------------------
const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('fullName email phone isActive createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// POST /api/admin/accounts
// -------------------------------------------------------
const createAdmin = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { fullName, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const admin = await User.create({
      fullName,
      email,
      phone,
      password,
      role: 'admin',
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
//  CATEGORY MANAGEMENT (FR6.10)
// =======================================================

// -------------------------------------------------------
// GET /api/admin/categories
// -------------------------------------------------------
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// POST /api/admin/categories
// -------------------------------------------------------
const addCategory = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { name, icon } = req.body;

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists.',
      });
    }

    // Get the actual product count for this category name
    const productCount = await Product.countDocuments({
      category: name,
      isDeleted: false,
    });

    const category = await Category.create({
      name,
      icon: icon || '📦',
      productCount,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// PUT /api/admin/categories/:id
// -------------------------------------------------------
const updateCategory = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const { name, icon, isActive } = req.body;

    // If deactivating, check for active products
    if (isActive === false && category.isActive === true) {
      const activeProducts = await Product.countDocuments({
        category: category.name,
        isDeleted: false,
        isPublished: true,
      });
      if (activeProducts > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot deactivate this category. It has ${activeProducts} active product(s). Please migrate or unpublish them first.`,
        });
      }
    }

    if (name) category.name = name;
    if (icon) category.icon = icon;
    if (typeof isActive === 'boolean') category.isActive = isActive;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
//  FINANCIAL OPERATIONS (FR6.7)
// =======================================================

// -------------------------------------------------------
// GET /api/admin/financials
// -------------------------------------------------------
const getFinancialSummary = async (req, res, next) => {
  try {
    const commissionRate = parseInt(process.env.PLATFORM_COMMISSION_RATE) || 10;

    // Total delivered order revenue
    const deliveredRevenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);

    const totalRevenue = deliveredRevenue.length > 0 ? deliveredRevenue[0].total : 0;
    const deliveredCount = deliveredRevenue.length > 0 ? deliveredRevenue[0].count : 0;
    const platformCommission = Math.round(totalRevenue * (commissionRate / 100));
    const netPayable = totalRevenue - platformCommission;

    // Total payouts processed
    const payoutResult = await Payout.aggregate([
      { $match: { status: 'processed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const totalPaidOut = payoutResult.length > 0 ? payoutResult[0].total : 0;
    const payoutCount = payoutResult.length > 0 ? payoutResult[0].count : 0;

    // Pending COD settlements
    const pendingCOD = await Order.aggregate([
      { $match: { status: 'delivered', paymentMethod: 'COD', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);

    // Refunds initiated
    const refundsInitiated = await Order.aggregate([
      { $match: { paymentStatus: 'refund_initiated' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      financials: {
        commissionRate,
        totalRevenue,
        deliveredOrders: deliveredCount,
        platformCommission,
        netPayable,
        totalPaidOut,
        payoutsProcessed: payoutCount,
        outstandingBalance: netPayable - totalPaidOut,
        codSettled: {
          total: pendingCOD.length > 0 ? pendingCOD[0].total : 0,
          count: pendingCOD.length > 0 ? pendingCOD[0].count : 0,
        },
        refunds: {
          total: refundsInitiated.length > 0 ? refundsInitiated[0].total : 0,
          count: refundsInitiated.length > 0 ? refundsInitiated[0].count : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// GET /api/admin/financials/payouts
// -------------------------------------------------------
const getSellerPayouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all approved sellers with their payout info
    const sellers = await Seller.find({ verificationStatus: 'approved' })
      .populate('user', 'fullName email')
      .select('shopName user')
      .sort({ shopName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Seller.countDocuments({ verificationStatus: 'approved' });
    const commissionRate = parseInt(process.env.PLATFORM_COMMISSION_RATE) || 10;

    const sellerPayoutData = await Promise.all(
      sellers.map(async (seller) => {
        // Revenue from delivered orders
        const revenue = await Order.aggregate([
          { $match: { status: 'delivered' } },
          { $unwind: '$items' },
          { $match: { 'items.seller': seller._id } },
          { $group: { _id: null, total: { $sum: '$items.itemTotal' }, count: { $sum: 1 } } },
        ]);

        const grossRevenue = revenue.length > 0 ? revenue[0].total : 0;
        const orderCount = revenue.length > 0 ? revenue[0].count : 0;
        const commission = Math.round(grossRevenue * (commissionRate / 100));
        const netPayable = grossRevenue - commission;

        // Total already paid out
        const paidResult = await Payout.aggregate([
          { $match: { seller: seller._id, status: 'processed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalPaid = paidResult.length > 0 ? paidResult[0].total : 0;

        return {
          sellerId: seller._id,
          shopName: seller.shopName,
          ownerName: seller.user?.fullName || 'N/A',
          ownerEmail: seller.user?.email || 'N/A',
          grossRevenue,
          commissionRate,
          commission,
          netPayable,
          totalPaid,
          balance: netPayable - totalPaid,
          deliveredOrders: orderCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: sellerPayoutData.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      payouts: sellerPayoutData,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// POST /api/admin/financials/payouts
// -------------------------------------------------------
const recordPayout = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { sellerId, amount, method, notes } = req.body;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }

    const commissionRate = parseInt(process.env.PLATFORM_COMMISSION_RATE) || 10;

    // Calculate gross amount (amount is net after commission)
    const grossAmount = Math.round(amount / (1 - commissionRate / 100));
    const commissionAmount = grossAmount - amount;

    const payout = await Payout.create({
      seller: sellerId,
      amount,
      commissionRate,
      commissionAmount,
      grossAmount,
      method: method || 'bank_transfer',
      status: 'processed',
      processedBy: req.user._id,
      processedAt: new Date(),
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: `Payout of LKR ${amount.toLocaleString()} to "${seller.shopName}" recorded successfully.`,
      payout,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
