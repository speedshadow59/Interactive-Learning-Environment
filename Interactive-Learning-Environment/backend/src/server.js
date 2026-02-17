const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const {
  errorHandler,
  gdprCompliance,
  sanitizeInputs,
  createRateLimiter,
} = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware - Security & GDPR
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply security middleware
app.use(sanitizeInputs); // XSS prevention
app.use(gdprCompliance); // Privacy headers
app.use(createRateLimiter(15 * 60 * 1000, 100)); // Rate limit: 100 requests per 15 minutes

// Connect to database
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/challenges', require('./routes/challengeRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/badges', require('./routes/badgeRoutes'));
app.use('/api/privacy', require('./routes/privacyRoutes')); // GDPR compliance endpoints
app.use('/api/execute', require('./routes/executeRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.BACKEND_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`GDPR compliance middleware loaded`);
});

module.exports = app;
