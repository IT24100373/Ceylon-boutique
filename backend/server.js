require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// --- Connect to MongoDB ---
connectDB();

const app = express();

// --- Core Middleware ---
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json()); // Parse incoming JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter); // Apply general rate limiter to all routes

// --- Health Check (useful for Render deployment) ---
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ceylon Boutique Marketplace API is running.',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  });
});

// --- API Routes ---
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/sellers', require('./routes/sellerRoutes'));
// Module 3 — Product & Inventory Management
app.use('/api/products', require('./routes/productRoutes'));
// Future modules will be added here:
// app.use('/api/orders', require('./routes/orderRoutes'));
// app.use('/api/reviews', require('./routes/reviewRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));

// --- 404 Handler (for unknown routes) ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --- Global Error Handler (must be last) ---
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
