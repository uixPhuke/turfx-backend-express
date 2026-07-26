const rateLimit = require("express-rate-limit");

// ==========================================
// Default API Limiter
// ==========================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes

  max: 200,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests. Please try again later.",
  },
});

// ==========================================
// Authentication Limiter
// ==========================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 10,

  standardHeaders: true,

  legacyHeaders: false,

  skipSuccessfulRequests: false,

  message: {
    success: false,
    message:
      "Too many login attempts. Please try again after 15 minutes.",
  },
});

// ==========================================
// OTP Limiter
// ==========================================

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,

  max: 5,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many OTP requests. Please wait before requesting again.",
  },
});

// ==========================================
// Password Reset Limiter
// ==========================================

const passwordLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,

  max: 5,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many password reset requests.",
  },
});

// ==========================================
// Payment Limiter
// ==========================================

const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,

  max: 20,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many payment requests.",
  },
});

// ==========================================
// Booking Limiter
// ==========================================

const bookingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,

  max: 30,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many booking requests.",
  },
});

// ==========================================
// Upload Limiter
// ==========================================

const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,

  max: 30,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Upload limit exceeded.",
  },
});

// ==========================================
// Admin Limiter
// ==========================================

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,

  max: 300,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many admin requests.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
  passwordLimiter,
  paymentLimiter,
  bookingLimiter,
  uploadLimiter,
  adminLimiter,
};