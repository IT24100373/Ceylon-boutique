const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

// -------------------------------------------------------
// Helper: extract validation errors (same pattern as all controllers)
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
// Helper: Recalculate and update Product average rating
// Called after every create/edit/delete/admin-remove
// -------------------------------------------------------
const recalculateProductRating = async (productId) => {
  const result = await Review.aggregate([
    {
      $match: {
        product: productId,
        reviewType: 'product',
        isDeleted: false,
        adminRemoved: false,
      },
    },
    {
      $group: {
        _id: null,
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = result.length > 0 ? Math.round(result[0].avg * 10) / 10 : 0;
  const count = result.length > 0 ? result[0].count : 0;

  await Product.findByIdAndUpdate(productId, {
    averageRating: avg,
    totalReviews: count,
  });
};

// -------------------------------------------------------
// Helper: Recalculate and update Seller average rating
// -------------------------------------------------------
const recalculateSellerRating = async (sellerId) => {
  const result = await Review.aggregate([
    {
      $match: {
        seller: sellerId,
        reviewType: 'seller',
        isDeleted: false,
        adminRemoved: false,
      },
    },
    {
      $group: {
        _id: null,
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = result.length > 0 ? Math.round(result[0].avg * 10) / 10 : 0;
  const count = result.length > 0 ? result[0].count : 0;

  await Seller.findByIdAndUpdate(sellerId, {
    averageRating: avg,
    totalReviews: count,
  });
};

// =======================================================
//  CUSTOMER ENDPOINTS
// =======================================================

// -------------------------------------------------------
// FR5.1 — POST /api/reviews
// Customer submits a review for a product or seller
// after a delivered order
// -------------------------------------------------------
const submitReview = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { orderId, orderItemId, reviewType, productId, sellerId, rating, reviewText, photos } = req.body;

    // --- Step 1: Find the order and verify ownership ---
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to you.',
      });
    }

    // --- Step 2: Order must be delivered ---
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'You can only review products from delivered orders.',
      });
    }

    // --- Step 3: Find the specific order item ---
    const orderItem = order.items.find(
      (item) => item._id.toString() === orderItemId
    );

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found in this order.',
      });
    }

    // --- Step 4: Validate review target matches the order item ---
    if (reviewType === 'product') {
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required for a product review.',
        });
      }
      if (orderItem.product.toString() !== productId) {
        return res.status(400).json({
          success: false,
          message: 'Product does not match this order item.',
        });
      }
    }

    if (reviewType === 'seller') {
      if (!sellerId) {
        return res.status(400).json({
          success: false,
          message: 'Seller ID is required for a seller review.',
        });
      }
      if (orderItem.seller.toString() !== sellerId) {
        return res.status(400).json({
          success: false,
          message: 'Seller does not match this order item.',
        });
      }
    }

    // --- Step 5: Check for duplicate review ---
    const existing = await Review.findOne({
      customer: req.user._id,
      order: orderId,
      orderItem: orderItemId,
      reviewType,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You have already submitted a ${reviewType} review for this order item.`,
      });
    }

    // --- Step 6: Create the review ---
    const reviewData = {
      customer: req.user._id,
      order: orderId,
      orderItem: orderItemId,
      reviewType,
      rating,
      reviewText: reviewText || '',
      photos: photos || [],
    };

    if (reviewType === 'product') reviewData.product = productId;
    if (reviewType === 'seller') reviewData.seller = sellerId;

    const review = await Review.create(reviewData);

    // --- Step 7: Recalculate ratings ---
    if (reviewType === 'product') {
      await recalculateProductRating(review.product);
    } else {
      await recalculateSellerRating(review.seller);
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Thank you for your feedback!',
      review: {
        id: review._id,
        reviewType: review.reviewType,
        rating: review.rating,
        reviewText: review.reviewText,
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    // Duplicate key error from MongoDB unique index
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this order item.',
      });
    }
    next(error);
  }
};

// -------------------------------------------------------
// FR5.2 — GET /api/reviews/product/:productId
// View paginated reviews for a product
// -------------------------------------------------------
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { sortBy = 'newest', page = 1, limit = 10 } = req.query;

    // Sort options
    const sortOptions = {
      newest: { createdAt: -1 },
      highest: { rating: -1, createdAt: -1 },
      helpful: { helpfulCount: -1, createdAt: -1 },
    };
    const sort = sortOptions[sortBy] || sortOptions.newest;

    const filter = {
      product: new mongoose.Types.ObjectId(productId),
      reviewType: 'product',
      isDeleted: false,
      adminRemoved: false,
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate('customer', 'fullName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('customer rating reviewText photos helpfulCount isEdited editedAt createdAt');

    const total = await Review.countDocuments(filter);

    // Build rating breakdown (5-star%, 4-star%, etc.)
    const breakdown = await Review.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const ratingMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdown.forEach((b) => { ratingMap[b._id] = b.count; });

    // Anonymise reviewer name: "Kasun P."
    const formattedReviews = reviews.map((r) => ({
      id: r._id,
      reviewerName: r.customer
        ? `${r.customer.fullName.split(' ')[0]} ${r.customer.fullName.split(' ').slice(-1)[0]?.charAt(0) || ''}.`
        : 'Customer',
      rating: r.rating,
      reviewText: r.reviewText,
      photos: r.photos,
      helpfulCount: r.helpfulCount,
      isEdited: r.isEdited,
      editedAt: r.editedAt,
      createdAt: r.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      ratingBreakdown: ratingMap,
      reviews: formattedReviews,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR5.3 — GET /api/reviews/seller/:sellerId
// View paginated reviews for a seller
// -------------------------------------------------------
const getSellerReviews = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { sortBy = 'newest', page = 1, limit = 10 } = req.query;

    const sortOptions = {
      newest: { createdAt: -1 },
      highest: { rating: -1, createdAt: -1 },
      helpful: { helpfulCount: -1, createdAt: -1 },
    };
    const sort = sortOptions[sortBy] || sortOptions.newest;

    const filter = {
      seller: new mongoose.Types.ObjectId(sellerId),
      reviewType: 'seller',
      isDeleted: false,
      adminRemoved: false,
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate('customer', 'fullName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('customer rating reviewText photos helpfulCount isEdited editedAt createdAt');

    const total = await Review.countDocuments(filter);

    const breakdown = await Review.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const ratingMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdown.forEach((b) => { ratingMap[b._id] = b.count; });

    const formattedReviews = reviews.map((r) => ({
      id: r._id,
      reviewerName: r.customer
        ? `${r.customer.fullName.split(' ')[0]} ${r.customer.fullName.split(' ').slice(-1)[0]?.charAt(0) || ''}.`
        : 'Customer',
      rating: r.rating,
      reviewText: r.reviewText,
      photos: r.photos,
      helpfulCount: r.helpfulCount,
      isEdited: r.isEdited,
      editedAt: r.editedAt,
      createdAt: r.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      ratingBreakdown: ratingMap,
      reviews: formattedReviews,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// GET /api/reviews/seller/:sellerId/products
// View paginated product reviews for all products of a seller
// -------------------------------------------------------
const getSellerProductReviews = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { sortBy = 'newest', page = 1, limit = 10 } = req.query;

    const sortOptions = {
      newest: { createdAt: -1 },
      highest: { rating: -1, createdAt: -1 },
      helpful: { helpfulCount: -1, createdAt: -1 },
    };
    const sort = sortOptions[sortBy] || sortOptions.newest;

    // Find all products owned by this seller
    const products = await Product.find({ seller: new mongoose.Types.ObjectId(sellerId) }).select('_id');
    const productIds = products.map((p) => p._id);

    const filter = {
      product: { $in: productIds },
      reviewType: 'product',
      isDeleted: false,
      adminRemoved: false,
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate('customer', 'fullName')
      .populate('product', 'name images')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('customer product rating reviewText photos helpfulCount isEdited editedAt createdAt');

    const total = await Review.countDocuments(filter);

    const breakdown = await Review.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const ratingMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdown.forEach((b) => { ratingMap[b._id] = b.count; });

    const formattedReviews = reviews.map((r) => ({
      id: r._id,
      reviewerName: r.customer
        ? `${r.customer.fullName.split(' ')[0]} ${r.customer.fullName.split(' ').slice(-1)[0]?.charAt(0) || ''}.`
        : 'Customer',
      productName: r.product?.name || 'Deleted Product',
      productImage: r.product?.images?.[0] || null,
      rating: r.rating,
      reviewText: r.reviewText,
      photos: r.photos,
      helpfulCount: r.helpfulCount,
      isEdited: r.isEdited,
      editedAt: r.editedAt,
      createdAt: r.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      ratingBreakdown: ratingMap,
      reviews: formattedReviews,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// GET /api/reviews/my-reviews
// Customer views all their own reviews
// -------------------------------------------------------
const getMyReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { customer: req.user._id, isDeleted: false };

    const reviews = await Review.find(filter)
      .populate('product', 'name images')
      .populate('seller', 'shopName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    // Attach edit window info
    const reviewsWithMeta = reviews.map((r) => {
      const hoursElapsed = (Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60);
      return {
        id: r._id,
        reviewType: r.reviewType,
        product: r.product,
        seller: r.seller,
        rating: r.rating,
        reviewText: r.reviewText,
        photos: r.photos,
        helpfulCount: r.helpfulCount,
        isEdited: r.isEdited,
        editedAt: r.editedAt,
        canEdit: hoursElapsed <= 72,
        hoursUntilLock: Math.max(0, 72 - Math.floor(hoursElapsed)),
        createdAt: r.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      reviews: reviewsWithMeta,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// GET /api/reviews/order/:orderId/status
// Returns which items in an order have been reviewed
// Used by OrderDetail screen to know what buttons to show
// -------------------------------------------------------
const getOrderReviewStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Verify the customer owns this order
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Find all existing reviews for this order by this customer
    const existingReviews = await Review.find({
      customer: req.user._id,
      order: orderId,
    }).select('orderItem reviewType rating');

    // Build a map: "orderItemId:reviewType" → true
    const reviewedMap = {};
    existingReviews.forEach((r) => {
      reviewedMap[`${r.orderItem}:${r.reviewType}`] = {
        reviewId: r._id,
        rating: r.rating,
      };
    });

    // Return status per item
    const itemStatuses = order.items.map((item) => ({
      orderItemId: item._id.toString(),
      productName: item.productName,
      productImage: item.productImage,
      productReviewed: !!reviewedMap[`${item._id}:product`],
      sellerReviewed: !!reviewedMap[`${item._id}:seller`],
      productReviewId: reviewedMap[`${item._id}:product`]?.reviewId || null,
      sellerReviewId: reviewedMap[`${item._id}:seller`]?.reviewId || null,
    }));

    res.status(200).json({
      success: true,
      orderId,
      orderStatus: order.status,
      canReview: order.status === 'delivered',
      items: itemStatuses,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR5.4 — PUT /api/reviews/:id
// Customer edits their own review (within 72 hours)
// -------------------------------------------------------
const editReview = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { rating, reviewText, photos } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      customer: req.user._id,
      isDeleted: false,
      adminRemoved: false,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to edit it.',
      });
    }

    // --- Check 72-hour edit window ---
    const hoursElapsed = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursElapsed > 72) {
      return res.status(400).json({
        success: false,
        message: 'Edit window has expired. Reviews can only be edited within 72 hours of submission.',
      });
    }

    // Apply updates
    if (rating !== undefined) review.rating = rating;
    if (reviewText !== undefined) review.reviewText = reviewText;
    if (photos !== undefined) review.photos = photos;
    review.isEdited = true;
    review.editedAt = new Date();

    await review.save();

    // Recalculate ratings after edit
    if (review.reviewType === 'product') {
      await recalculateProductRating(review.product);
    } else {
      await recalculateSellerRating(review.seller);
    }

    res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      review: {
        id: review._id,
        rating: review.rating,
        reviewText: review.reviewText,
        isEdited: review.isEdited,
        editedAt: review.editedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR5.5 — DELETE /api/reviews/:id
// Customer deletes their own review (permanent removal from public view)
// Soft-delete: isDeleted = true (retained for auditing)
// -------------------------------------------------------
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      customer: req.user._id,
      isDeleted: false,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or already deleted.',
      });
    }

    // Soft delete
    review.isDeleted = true;
    await review.save();

    // Recalculate ratings after deletion
    if (review.reviewType === 'product') {
      await recalculateProductRating(review.product);
    } else {
      await recalculateSellerRating(review.seller);
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully. Ratings have been updated.',
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// PUT /api/reviews/:id/helpful
// Increment the helpful count on a review (simple counter)
// -------------------------------------------------------
const markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      isDeleted: false,
      adminRemoved: false,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    review.helpfulCount += 1;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Marked as helpful.',
      helpfulCount: review.helpfulCount,
    });
  } catch (error) {
    next(error);
  }
};

// =======================================================
//  ADMIN ENDPOINTS
// =======================================================

// -------------------------------------------------------
// FR5.6 — GET /api/reviews/admin/all
// Admin views all reviews with filters
// -------------------------------------------------------
const adminGetAllReviews = async (req, res, next) => {
  try {
    const {
      reviewType,
      rating,
      adminRemoved,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { isDeleted: false };

    if (reviewType) filter.reviewType = reviewType;
    if (rating) filter.rating = parseInt(rating);
    if (adminRemoved !== undefined) filter.adminRemoved = adminRemoved === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let reviews = await Review.find(filter)
      .populate('customer', 'fullName email')
      .populate('product', 'name')
      .populate('seller', 'shopName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Search filter (after population — search by product name or seller name)
    if (search) {
      const s = search.toLowerCase();
      reviews = reviews.filter((r) => {
        const productName = r.product?.name?.toLowerCase() || '';
        const shopName = r.seller?.shopName?.toLowerCase() || '';
        const text = r.reviewText?.toLowerCase() || '';
        return productName.includes(s) || shopName.includes(s) || text.includes(s);
      });
    }

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR5.6 — PUT /api/reviews/admin/:id/remove
// Admin removes a policy-violating review
// -------------------------------------------------------
const adminRemoveReview = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { reason } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      isDeleted: false,
      adminRemoved: false,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or already removed.',
      });
    }

    review.adminRemoved = true;
    review.removalReason = reason;
    await review.save();

    // Recalculate ratings after admin removal
    if (review.reviewType === 'product') {
      await recalculateProductRating(review.product);
    } else {
      await recalculateSellerRating(review.seller);
    }

    res.status(200).json({
      success: true,
      message: 'Review removed successfully. Ratings have been recalculated.',
      review: {
        id: review._id,
        adminRemoved: review.adminRemoved,
        removalReason: review.removalReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Customer
  submitReview,
  getProductReviews,
  getSellerReviews,
  getSellerProductReviews,
  getMyReviews,
  getOrderReviewStatus,
  editReview,
  deleteReview,
  markHelpful,
  // Admin
  adminGetAllReviews,
  adminRemoveReview,
};
