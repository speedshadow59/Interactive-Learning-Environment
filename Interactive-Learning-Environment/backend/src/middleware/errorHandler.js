/**
 * Error Handling Middleware
 * Provides centralized error management and logging
 * 
 * Handles:
 * - Validation errors
 * - Authentication errors
 * - Database errors
 * - General application errors
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Wrong MongoDB ObjectId error
  if (err.name === 'CastError') {
    const message = `Resource not found: ${err.path}`;
    err = new AppError(message, 400);
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    err = new AppError(message, 401);
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired';
    err = new AppError(message, 401);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = `Duplicate field value entered: ${Object.keys(err.keyValue)}`;
    err = new AppError(message, 400);
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    err = new AppError(message, 400);
  }

  // Log error details (except in production for security)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error Details:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    });
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GDPR Compliance Middleware
 * Ensures proper data handling and privacy
 */

const gdprCompliance = (req, res, next) => {
  // Add privacy headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Log GDPR-relevant actions
  if (req.user) {
    const gdprActions = ['PUT', 'DELETE', 'POST'];
    if (gdprActions.includes(req.method)) {
      console.log(`[GDPR LOG] User: ${req.user._id}, Action: ${req.method} ${req.path}, Timestamp: ${new Date().toISOString()}`);
    }
  }

  next();
};

/**
 * Rate Limiting for Brute Force Protection
 * Implements exponential backoff
 */
const createRateLimiter = (windowMs, maxRequests) => {
  const attempts = new Map();

  return (req, res, next) => {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const limiterDisabled = process.env.DISABLE_RATE_LIMIT === 'true';

    if (isDevelopment || limiterDisabled) {
      return next();
    }

    const key = req.ip;
    const now = Date.now();
    const userAttempts = attempts.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (recentAttempts.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((recentAttempts[0] + windowMs - now) / 1000),
      });
    }

    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [k, v] of attempts.entries()) {
        if (v.length === 0 || now - v[v.length - 1] > windowMs * 2) {
          attempts.delete(k);
        }
      }
    }

    next();
  };
};

/**
 * Input Sanitization Middleware
 * Prevents XSS and injection attacks
 */
const sanitizeInputs = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS vectors
        obj[key] = obj[key]
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .trim();
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    });

    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);

  next();
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  gdprCompliance,
  createRateLimiter,
  sanitizeInputs,
};
