const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

// -------------------------------------------------------
// Helper: extract validation errors (same pattern as other controllers)
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
// FR3.1 — POST /api/products
// Verified seller adds a new product listing
// -------------------------------------------------------
const addProduct = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const {
      name, description, category, price,
      sizes, colors, images, variants,
    } = req.body;

    // req.seller is attached by requireVerifiedSeller middleware
    const sellerId = req.seller._id;

    const product = await Product.create({
      seller: sellerId,
      name,
      description,
      category,
      price,
      sizes,
      colors: colors || [],
      images,
      variants,
    });

    // Update seller's product count
    await Seller.findByIdAndUpdate(sellerId, { $inc: { productCount: 1 } });

    res.status(201).json({
      success: true,
      message: 'Product listed successfully! It is now visible to customers.',
      product: {
        id: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        totalStock: product.totalStock,
        isPublished: product.isPublished,
        createdAt: product.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR3.2 — GET /api/products
// Customer browses, searches, and filters products
// -------------------------------------------------------
const getProducts = async (req, res, next) => {
  try {
    const {
      search, category, minPrice, maxPrice,
      size, color, inStock, sortBy,
      page = 1, limit = 20,
    } = req.query;

    // Base filter: only published, non-deleted products
    const filter = { isPublished: true, isDeleted: false };

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Size filter
    if (size) {
      filter.sizes = size;
    }

    // Color filter
    if (color) {
      filter['colors.name'] = { $regex: color, $options: 'i' };
    }

    // In-stock filter
    if (inStock === 'true') {
      filter.totalStock = { $gt: 0 };
    }

    // Keyword search (on name and description)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort options
    let sort = { createdAt: -1 }; // default: newest first
    if (sortBy === 'price_low') sort = { price: 1 };
    if (sortBy === 'price_high') sort = { price: -1 };
    if (sortBy === 'popular') sort = { averageRating: -1, totalReviews: -1 };
    if (sortBy === 'newest') sort = { createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .populate('seller', 'shopName shopLogo averageRating')
      .select('name price images category sizes colors totalStock averageRating totalReviews createdAt')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      products,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR3.3 — GET /api/products/:id
// View full product detail page
// -------------------------------------------------------
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate('seller', 'shopName shopLogo shopDescription averageRating totalReviews user');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // If product is unpublished, only allow the owning seller or admin to view it
    if (!product.isPublished) {
      const isSeller = req.user && req.user.role === 'seller' && req.seller && req.seller._id.toString() === product.seller._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isSeller && !isAdmin) {
        return res.status(404).json({
          success: false,
          message: 'This product is currently unavailable.',
        });
      }
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR3.2 — GET /api/products/shop/:sellerId
// Get all published products for a specific shop
// -------------------------------------------------------
const getProductsByShop = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      seller: req.params.sellerId,
      isPublished: true,
      isDeleted: false,
    };

    const products = await Product.find(filter)
      .select('name price images category totalStock averageRating totalReviews createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      products,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR3.4 — GET /api/products/seller/my-products
// Seller views their own product listings
// -------------------------------------------------------
const getMyProducts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const sellerId = req.seller._id;

    const filter = { seller: sellerId, isDeleted: false };

    // Optional status filter
    if (status === 'published') filter.isPublished = true;
    if (status === 'unpublished') filter.isPublished = false;
    if (status === 'out_of_stock') {
      filter.isPublished = true;
      filter.totalStock = 0;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .select('name price images category totalStock isPublished averageRating totalReviews createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    // Also get quick counts for the status tabs
    const totalAll = await Product.countDocuments({ seller: sellerId, isDeleted: false });
    const totalPublished = await Product.countDocuments({ seller: sellerId, isDeleted: false, isPublished: true });
    const totalUnpublished = await Product.countDocuments({ seller: sellerId, isDeleted: false, isPublished: false });
    const totalOutOfStock = await Product.countDocuments({ seller: sellerId, isDeleted: false, isPublished: true, totalStock: 0 });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: {
        all: totalAll,
        published: totalPublished,
        unpublished: totalUnpublished,
        outOfStock: totalOutOfStock,
      },
      products,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR3.4 — PUT /api/products/:id
// Seller edits their own product info
// -------------------------------------------------------
const updateProduct = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.seller._id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to edit it.',
      });
    }

    const { name, description, category, price, sizes, colors, images } = req.body;

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.category = category ?? product.category;
    product.price = price ?? product.price;
    product.sizes = sizes ?? product.sizes;
    product.colors = colors ?? product.colors;
    product.images = images ?? product.images;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: {
        id: product._id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        sizes: product.sizes,
        colors: product.colors,
        images: product.images,
        totalStock: product.totalStock,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR3.5 — PUT /api/products/:id/stock
// Seller updates stock quantity per variant
// -------------------------------------------------------
const updateStock = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.seller._id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to manage its stock.',
      });
    }

    const { variants } = req.body;

    // Replace all variants with the updated data
    product.variants = variants;
    await product.save(); // pre-save hook recalculates totalStock

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully.',
      product: {
        id: product._id,
        name: product.name,
        variants: product.variants,
        totalStock: product.totalStock,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR3.6 — PUT /api/products/:id/unpublish
// Seller hides a product from customer view
// -------------------------------------------------------
const unpublishProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.seller._id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission.',
      });
    }

    if (!product.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Product is already unpublished.',
      });
    }

    product.isPublished = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product unpublished. It is now hidden from customers.',
      product: {
        id: product._id,
        name: product.name,
        isPublished: product.isPublished,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR3.6 — PUT /api/products/:id/republish
// Seller makes a hidden product visible again
// -------------------------------------------------------
const republishProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.seller._id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission.',
      });
    }

    if (product.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Product is already published.',
      });
    }

    product.isPublished = true;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product republished. It is now visible to customers.',
      product: {
        id: product._id,
        name: product.name,
        isPublished: product.isPublished,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR3.6 — DELETE /api/products/:id
// Seller soft-deletes a product
// -------------------------------------------------------
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.seller._id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to delete it.',
      });
    }

    // Soft delete — mark as deleted and unpublish
    product.isDeleted = true;
    product.isPublished = false;
    await product.save();

    // Decrement seller's product count
    await Seller.findByIdAndUpdate(req.seller._id, { $inc: { productCount: -1 } });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------
// FR3.6 — PUT /api/products/admin/:id/unpublish
// Admin force-unpublishes any product
// -------------------------------------------------------
const adminUnpublishProduct = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'A reason is required when unpublishing a product.',
      });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    product.isPublished = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product has been unpublished by admin.',
      product: {
        id: product._id,
        name: product.name,
        isPublished: product.isPublished,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
