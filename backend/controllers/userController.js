const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Address = require('../models/Address');

// -------------------------------------------------------
// Helper: generate JWT token
// -------------------------------------------------------
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// -------------------------------------------------------
// Helper: extract validation errors from express-validator
// -------------------------------------------------------
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
// FR1.1 — POST /api/users/register
// -------------------------------------------------------
const register = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { fullName, email, phone, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user (password hashing is handled in the pre-save hook)
    const user = await User.create({ fullName, email, phone, password });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to Ceylon Boutique!',
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
// FR1.2 — POST /api/users/login
// -------------------------------------------------------
const login = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { email, password } = req.body;

    // Fetch user including password (select: false by default)
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if account is deactivated
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Check if account is temporarily locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
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

    // Successful login — reset attempt counters
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
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
// FR1.3 — GET /api/users/profile
// -------------------------------------------------------
const getProfile = async (req, res, next) => {
  try {
    const user = req.user; // attached by auth middleware

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR1.4 — PUT /api/users/profile
// -------------------------------------------------------
const updateProfile = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { fullName, phone } = req.body;

    // Only allow updating name and phone (email is read-only identifier)
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { ...(fullName && { fullName }), ...(phone && { phone }) },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR1.5 — PUT /api/users/change-password
// -------------------------------------------------------
const changePassword = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { currentPassword, newPassword } = req.body;

    // Re-fetch user with password field
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. Please log in again.',
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR1.6 — GET /api/users/addresses
// -------------------------------------------------------
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: addresses.length,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR1.6 — POST /api/users/addresses
// -------------------------------------------------------
const addAddress = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { label, addressLine1, addressLine2, city, province, postalCode, isDefault } = req.body;

    // If this is set as default, unset all other defaults first
    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    // Check if this is the user's first address — auto-set as default
    const existingCount = await Address.countDocuments({ user: req.user._id });
    const shouldBeDefault = isDefault || existingCount === 0;

    const address = await Address.create({
      user: req.user._id,
      label,
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully.',
      address,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR1.6 — PUT /api/users/addresses/:id
// -------------------------------------------------------
const updateAddress = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    const { label, addressLine1, addressLine2, city, province, postalCode } = req.body;

    address.label = label ?? address.label;
    address.addressLine1 = addressLine1 ?? address.addressLine1;
    address.addressLine2 = addressLine2 ?? address.addressLine2;
    address.city = city ?? address.city;
    address.province = province ?? address.province;
    address.postalCode = postalCode ?? address.postalCode;

    await address.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      address,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR1.6 — DELETE /api/users/addresses/:id
// -------------------------------------------------------
const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    await address.deleteOne();

    // If deleted address was default and others exist, auto-promote the newest one
    if (address.isDefault) {
      const nextAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR1.6 — PUT /api/users/addresses/:id/default
// -------------------------------------------------------
const setDefaultAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    // Unset all other defaults for this user, then set the chosen one
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated.',
      address,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR1.7 — PUT /api/users/deactivate
// -------------------------------------------------------
const deactivateAccount = async (req, res, next) => {
  try {
    // Placeholder: In Module 4 we will check for active orders here.
    // For now, we proceed directly with deactivation.

    await User.findByIdAndUpdate(req.user._id, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Your account has been deactivated. We are sorry to see you go.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
