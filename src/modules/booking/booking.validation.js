const { body, param } = require("express-validator");

// ==========================================
// Create Booking Validation
// ==========================================

const createBookingValidation = [
  body("turf")
    .notEmpty()
    .withMessage("Turf ID is required")
    .isMongoId()
    .withMessage("Invalid turf ID"),

  body("bookingDate")
    .notEmpty()
    .withMessage("Booking date is required")
    .isISO8601()
    .withMessage("Invalid booking date"),

  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Invalid start time"),

  body("endTime")
    .notEmpty()
    .withMessage("End time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Invalid end time"),

  body("players")
    .notEmpty()
    .withMessage("Number of players is required")
    .isInt({ min: 1 })
    .withMessage("Players must be at least 1"),

  body("sport")
    .notEmpty()
    .withMessage("Sport is required")
    .isIn([
      "football",
      "cricket",
      "badminton",
      "basketball",
      "volleyball",
      "tennis",
    ])
    .withMessage("Invalid sport"),

  body("couponCode")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Invalid coupon code"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),
];

// ==========================================
// Cancel Booking Validation
// ==========================================

const cancelBookingValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid booking ID"),

  body("reason")
    .notEmpty()
    .withMessage("Cancellation reason is required")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage(
      "Reason must be between 5 and 500 characters"
    ),
];
// ==========================================
// Verify Payment Validation
// ==========================================

const verifyPaymentValidation = [
  body("bookingId")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isMongoId()
    .withMessage("Invalid booking ID"),

  body("razorpay_order_id")
    .notEmpty()
    .withMessage("Razorpay Order ID is required"),

  body("razorpay_payment_id")
    .notEmpty()
    .withMessage("Razorpay Payment ID is required"),

  body("razorpay_signature")
    .notEmpty()
    .withMessage("Razorpay Signature is required"),
];

// ==========================================
// Booking ID Validation
// ==========================================

const bookingIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid booking ID"),
];

// ==========================================
// User Booking Validation
// ==========================================

const userBookingsValidation = [];

// ==========================================
// Owner Booking Validation
// ==========================================

const ownerBookingsValidation = [];

// ==========================================
// Booking Status Validation
// ==========================================

const bookingStatusValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid booking ID"),

  body("status")
    .notEmpty()
    .withMessage("Booking status is required")
    .isIn([
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "expired",
    ])
    .withMessage("Invalid booking status"),
];
const { query } = require("express-validator");

// ==========================================
// Search Validation
// ==========================================

const searchBookingsValidation = [
  query("status")
    .optional()
    .isIn([
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "expired",
    ])
    .withMessage("Invalid booking status"),

  query("paymentStatus")
    .optional()
    .isIn([
      "pending",
      "paid",
      "failed",
      "refunded",
    ])
    .withMessage("Invalid payment status"),

  query("sport")
    .optional()
    .isIn([
      "football",
      "cricket",
      "badminton",
      "basketball",
      "volleyball",
      "tennis",
    ])
    .withMessage("Invalid sport"),
];

// ==========================================
// Date Filter Validation
// ==========================================

const dateFilterValidation = [
  query("from")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date"),

  query("to")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date"),
];

// ==========================================
// Pagination Validation
// ==========================================

const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be greater than 0"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

// ==========================================
// Revenue Validation
// ==========================================

const revenueValidation = [
  query("month")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Invalid month"),

  query("year")
    .optional()
    .isInt({ min: 2024 })
    .withMessage("Invalid year"),
];

// ==========================================
// Module Exports
// ==========================================

module.exports = {
  createBookingValidation,
  cancelBookingValidation,

  verifyPaymentValidation,

  bookingIdValidation,

  userBookingsValidation,
  ownerBookingsValidation,

  bookingStatusValidation,

  searchBookingsValidation,
  dateFilterValidation,
  paginationValidation,
  revenueValidation,
};