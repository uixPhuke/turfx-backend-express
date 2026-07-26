const { body, param } = require("express-validator");

// ==========================================
// Create Payment Validation
// ==========================================

const createPaymentValidation = [
  body("bookingId")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isMongoId()
    .withMessage("Invalid booking ID"),

  body("paymentMethod")
    .optional()
    .isIn([
      "razorpay",
      "upi",
      "card",
      "netbanking",
      "wallet",
    ])
    .withMessage("Invalid payment method"),
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
// Refund Payment Validation
// ==========================================

const refundPaymentValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid payment ID"),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Refund reason is required")
    .isLength({ min: 5, max: 500 })
    .withMessage(
      "Refund reason must be between 5 and 500 characters"
    ),
];

// ==========================================
// Payment ID Validation
// ==========================================

const paymentIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid payment ID"),
];

// ==========================================
// Webhook Validation
// ==========================================

const webhookValidation = [
  body("event")
    .notEmpty()
    .withMessage("Webhook event is required"),

  body("payload")
    .notEmpty()
    .withMessage("Webhook payload is required"),
];

// ==========================================
// Settlement Validation
// ==========================================

const settlementValidation = [
  body("paymentId")
    .notEmpty()
    .withMessage("Payment ID is required")
    .isMongoId()
    .withMessage("Invalid payment ID"),

  body("settlementId")
    .trim()
    .notEmpty()
    .withMessage("Settlement ID is required"),

  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Settlement amount must be greater than or equal to 0"),
];

const { query } = require("express-validator");

// ==========================================
// Search Validation
// ==========================================

const searchPaymentsValidation = [
  query("status")
    .optional()
    .isIn([
      "created",
      "pending",
      "authorized",
      "captured",
      "paid",
      "failed",
      "cancelled",
      "refunded",
      "partially_refunded",
    ])
    .withMessage("Invalid payment status"),

  query("paymentMethod")
    .optional()
    .isIn([
      "razorpay",
      "upi",
      "card",
      "netbanking",
      "wallet",
    ])
    .withMessage("Invalid payment method"),
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
    .withMessage(
      "Limit must be between 1 and 100"
    ),
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
  createPaymentValidation,
  verifyPaymentValidation,

  refundPaymentValidation,
  paymentIdValidation,
  webhookValidation,
  settlementValidation,

  searchPaymentsValidation,
  dateFilterValidation,
  paginationValidation,
  revenueValidation,
};
