const express = require("express");

const router = express.Router();

const authController = require("./auth.controller");

const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  changePasswordValidation,
  resendVerificationValidation,
} = require("./auth.validation");

const validate = require("../../middlewares/validation.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");

const {
  authLimiter,
  otpLimiter,
  passwordLimiter,
} = require("../../middlewares/rateLimiter");

// ==========================================
// Public Routes
// ==========================================
console.log({
  authLimiter: typeof authLimiter,
  otpLimiter: typeof otpLimiter,
  passwordLimiter: typeof passwordLimiter,

  registerValidation: typeof registerValidation,
  loginValidation: typeof loginValidation,
  forgotPasswordValidation: typeof forgotPasswordValidation,
  verifyOtpValidation: typeof verifyOtpValidation,
  resetPasswordValidation: typeof resetPasswordValidation,
  changePasswordValidation: typeof changePasswordValidation,
  resendVerificationValidation: typeof resendVerificationValidation,

  validate: typeof validate,
  authMiddleware: typeof authMiddleware,

  register: typeof authController.register,
  login: typeof authController.login,
  refreshToken: typeof authController.refreshToken,
  forgotPassword: typeof authController.forgotPassword,
  verifyOtp: typeof authController.verifyOtp,
  resetPassword: typeof authController.resetPassword,
  verifyEmail: typeof authController.verifyEmail,
  resendVerificationEmail: typeof authController.resendVerificationEmail,
  getCurrentUser: typeof authController.getCurrentUser,
  logout: typeof authController.logout,
  changePassword: typeof authController.changePassword,
});
// Register
router.post(
  "/register",
  authLimiter,
  registerValidation,
  validate,
  authController.register
);

// Login
router.post(
  "/login",
  authLimiter,
  loginValidation,
  validate,
  authController.login
);

// Refresh Access Token
router.post(
  "/refresh-token",
  authLimiter,
  authController.refreshToken
);

// Forgot Password
router.post(
  "/forgot-password",
  passwordLimiter,
  forgotPasswordValidation,
  validate,
  authController.forgotPassword
);

// Verify OTP
router.post(
  "/verify-otp",
  otpLimiter,
  verifyOtpValidation,
  validate,
  authController.verifyOtp
);

// Reset Password
router.post(
  "/reset-password",
  passwordLimiter,
  resetPasswordValidation,
  validate,
  authController.resetPassword
);

// Verify Email
router.post(
  "/verify-email",
  otpLimiter,
  verifyOtpValidation,
  validate,
  authController.verifyEmail
);

// Resend Verification Email
router.post(
  "/resend-verification",
  otpLimiter,
  resendVerificationValidation,
  validate,
  authController.resendVerificationEmail
);

// ==========================================
// Protected Routes
// ==========================================

// Get Current User
router.get(
  "/me",
  authMiddleware,
  authController.getCurrentUser
);

// Logout
router.post(
  "/logout",
  authLimiter,
  authMiddleware,
  authController.logout
);

// Change Password
router.patch(
  "/change-password",
  authMiddleware,
  passwordLimiter,
  changePasswordValidation,
  validate,
  authController.changePassword
);

module.exports = router;