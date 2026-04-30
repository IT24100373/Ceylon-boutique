const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Order = require('../models/Order');

// -------------------------------------------------------
// Helpers (same pattern as userController)
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

// -------------------------------------------------------
// FR2.1 — POST /api/sellers/register
// -------------------------------------------------------
const registerSeller = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const {
      fullName, email, phone, password,
      shopName, shopDescription, categoryFocus,
      businessRegNumber, nicNumber, documentsUrl,
      bankName, bankBranch, bankAccountNumber, bankAccountName,
      contactAddress,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const existingShop = await Seller.findOne({ shopName });
    if (existingShop) {
      return res.status(400).json({
        success: false,
        message: 'A shop with this name already exists. Please choose a different name.',
      });
    }

    const user = await User.create({
      fullName, email, phone, password, role: 'seller',
    });

    const seller = await Seller.create({
      user: user._id, shopName,
      shopDescription: shopDescription || '',
      categoryFocus: categoryFocus || '',
      businessRegNumber, nicNumber,
      documentsUrl: documentsUrl || '',
      bankName, bankBranch, bankAccountNumber, bankAccountName,
      contactAddress,
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Seller account created! Your shop is under review. We will notify you within 3-5 business days.',
      token,
      user: {
        id: user._id, fullName: user.fullName, email: user.email,
        phone: user.phone, role: user.role, createdAt: user.createdAt,
      },
      seller: {
        id: seller._id, shopName: seller.shopName,
        verificationStatus: seller.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR2.1 — POST /api/sellers/login
// -------------------------------------------------------
const loginSeller = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'This account is not a seller account. Please use the customer login.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false, message: 'Your account has been deactivated. Please contact support.',
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false, message: `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
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
          success: false, message: 'Too many failed attempts. Account locked for 15 minutes.',
        });
      }
      await user.save();
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${5 - user.loginAttempts} attempt(s) remaining.`,
      });
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const seller = await Seller.findOne({ user: user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true, message: 'Login successful.', token,
      user: {
        id: user._id, fullName: user.fullName, email: user.email,
        phone: user.phone, role: user.role, createdAt: user.createdAt,
      },
      seller: {
        id: seller._id, shopName: seller.shopName,
        verificationStatus: seller.verificationStatus,
        rejectionReason: seller.rejectionReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR2.3 — GET /api/sellers/my-shop
// -------------------------------------------------------
const getMyShop = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    res.status(200).json({
      success: true,
      seller: {
        id: seller._id, shopName: seller.shopName,
        shopDescription: seller.shopDescription,
        shopLogo: seller.shopLogo, shopBanner: seller.shopBanner,
        categoryFocus: seller.categoryFocus,
        businessRegNumber: seller.businessRegNumber,
        nicNumber: seller.nicNumber, documentsUrl: seller.documentsUrl,
        bankName: seller.bankName, bankBranch: seller.bankBranch,
        bankAccountNumber: seller.bankAccountNumber,
        bankAccountName: seller.bankAccountName,
        contactAddress: seller.contactAddress,
        verificationStatus: seller.verificationStatus,
        rejectionReason: seller.rejectionReason,
        suspensionReason: seller.suspensionReason,
        productCount: seller.productCount,
        averageRating: seller.averageRating,
        totalReviews: seller.totalReviews,
        createdAt: seller.createdAt, updatedAt: seller.updatedAt,
      },
      owner: {
        fullName: req.user.fullName, email: req.user.email, phone: req.user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR2.3 — GET /api/sellers/shop/:id (public view)
// -------------------------------------------------------
const getShopPublic = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.params.id).populate('user', 'fullName createdAt');
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Shop not found.' });
    }
    if (seller.verificationStatus !== 'approved') {
      return res.status(404).json({ success: false, message: 'This shop is not currently available.' });
    }

    res.status(200).json({
      success: true,
      shop: {
        id: seller._id, shopName: seller.shopName,
        shopDescription: seller.shopDescription,
        shopLogo: seller.shopLogo, shopBanner: seller.shopBanner,
        categoryFocus: seller.categoryFocus,
        productCount: seller.productCount,
        averageRating: seller.averageRating, totalReviews: seller.totalReviews,
        ownerName: seller.user?.fullName, joinedDate: seller.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR2.3 — GET /api/sellers/dashboard
// -------------------------------------------------------
const getSellerDashboard = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    // --- Module 4: Real order stats ---
    const sellerId = seller._id;

    const pendingOrders = await Order.countDocuments({
      'items.seller': sellerId,
      status: 'pending',
    });

    const totalOrders = await Order.countDocuments({
      'items.seller': sellerId,
    });

    // Revenue = sum of totalAmount for all delivered orders
    const revenueResult = await Order.aggregate([
      { $match: { 'items.seller': sellerId, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.status(200).json({
      success: true,
      dashboard: {
        shopName: seller.shopName,
        verificationStatus: seller.verificationStatus,
        productCount: seller.productCount,
        averageRating: seller.averageRating,
        totalReviews: seller.totalReviews,
        pendingOrders,
        totalOrders,
        revenue,
      },
      owner: { fullName: req.user.fullName, email: req.user.email },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR2.4 — PUT /api/sellers/my-shop
// -------------------------------------------------------
const updateShopInfo = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const { shopName, shopDescription, shopLogo, shopBanner, categoryFocus } = req.body;

    if (shopName && shopName !== seller.shopName) {
      const existingShop = await Seller.findOne({ shopName });
      if (existingShop) {
        return res.status(400).json({ success: false, message: 'A shop with this name already exists.' });
      }
    }

    seller.shopName = shopName ?? seller.shopName;
    seller.shopDescription = shopDescription ?? seller.shopDescription;
    seller.shopLogo = shopLogo ?? seller.shopLogo;
    seller.shopBanner = shopBanner ?? seller.shopBanner;
    seller.categoryFocus = categoryFocus ?? seller.categoryFocus;
    await seller.save();

    res.status(200).json({
      success: true, message: 'Shop profile updated successfully.',
      seller: {
        id: seller._id, shopName: seller.shopName,
        shopDescription: seller.shopDescription,
        shopLogo: seller.shopLogo, shopBanner: seller.shopBanner,
        categoryFocus: seller.categoryFocus, updatedAt: seller.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR2.5 — PUT /api/sellers/my-shop/documents
// -------------------------------------------------------
const updateDocuments = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const { businessRegNumber, nicNumber, documentsUrl } = req.body;
    seller.businessRegNumber = businessRegNumber ?? seller.businessRegNumber;
    seller.nicNumber = nicNumber ?? seller.nicNumber;
    seller.documentsUrl = documentsUrl ?? seller.documentsUrl;
    await seller.save();

    res.status(200).json({
      success: true, message: 'Business documents updated successfully.',
      seller: {
        id: seller._id, businessRegNumber: seller.businessRegNumber,
        nicNumber: seller.nicNumber, documentsUrl: seller.documentsUrl,
        updatedAt: seller.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR6.4 — GET /api/sellers/admin/all
// -------------------------------------------------------
const getAllSellers = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status;
    if (search) {
      filter.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { categoryFocus: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sellers = await Seller.find(filter)
      .populate('user', 'fullName email phone isActive createdAt')
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Seller.countDocuments(filter);

    res.status(200).json({
      success: true, count: sellers.length, total,
      page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)),
      sellers,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR6.4 — GET /api/sellers/admin/:id
// -------------------------------------------------------
const getSellerDetails = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.params.id)
      .populate('user', 'fullName email phone isActive createdAt updatedAt');
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }
    res.status(200).json({ success: true, seller });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR2.2 — PUT /api/sellers/admin/:id/verify
// -------------------------------------------------------
const verifySeller = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const { status, rejectionReason } = req.body;
    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }

    if (seller.verificationStatus !== 'pending' && seller.verificationStatus !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Cannot verify a seller with status: ${seller.verificationStatus}.`,
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false, message: 'Rejection reason is required when rejecting a seller.',
      });
    }

    seller.verificationStatus = status;
    seller.rejectionReason = status === 'rejected' ? rejectionReason : '';
    await seller.save();

    res.status(200).json({
      success: true,
      message: `Seller has been ${status === 'approved' ? 'approved' : 'rejected'} successfully.`,
      seller: {
        id: seller._id, shopName: seller.shopName,
        verificationStatus: seller.verificationStatus,
        rejectionReason: seller.rejectionReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR2.6 — PUT /api/sellers/admin/:id/suspend
// -------------------------------------------------------
const suspendSeller = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Suspension reason is required.' });
    }

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }
    if (seller.verificationStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Can only suspend approved sellers. Current status: ${seller.verificationStatus}`,
      });
    }

    seller.verificationStatus = 'suspended';
    seller.suspensionReason = reason;
    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Seller has been suspended. Their shop is now hidden from customers.',
      seller: {
        id: seller._id, shopName: seller.shopName,
        verificationStatus: seller.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR2.6 — PUT /api/sellers/admin/:id/remove
// -------------------------------------------------------
const removeSeller = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Removal reason is required.' });
    }

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }
    if (seller.verificationStatus === 'removed') {
      return res.status(400).json({ success: false, message: 'This seller has already been removed.' });
    }

    seller.verificationStatus = 'removed';
    seller.suspensionReason = reason;
    await seller.save();

    await User.findByIdAndUpdate(seller.user, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Seller has been permanently removed. Account deactivated and listings unpublished.',
      seller: {
        id: seller._id, shopName: seller.shopName,
        verificationStatus: seller.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerSeller, loginSeller, getMyShop, getShopPublic,
  getSellerDashboard, updateShopInfo, updateDocuments,
  getAllSellers, getSellerDetails, verifySeller, suspendSeller, removeSeller,
};
