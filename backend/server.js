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
// CORS: Allow mobile app, admin web panel, and any configured origins
const allowedOrigins = [
  'http://localhost:5173',   // Admin web (Vite dev server)
  'http://localhost:3000',   // Admin web (alternative port)
  process.env.ADMIN_WEB_URL, // Production admin URL (from .env)
].filter(Boolean);

app.use(cors({
  origin: process.env.CORS_ORIGIN === '*'
    ? '*'  // Development: allow all origins
    : function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
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
// Module 4 — Order Management
app.use('/api/orders', require('./routes/orderRoutes'));
// Module 5 — Reviews & Ratings
app.use('/api/reviews', require('./routes/reviewRoutes'));
// Module 6 — Admin & Platform Management
app.use('/api/admin', require('./routes/adminRoutes'));

// --- File Upload Routes ---
app.use('/api/upload', require('./routes/uploadRoutes'));

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

