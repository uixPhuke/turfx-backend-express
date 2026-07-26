const { body, param } = require("express-validator");

// ==========================================
// Create Coupon Validation
// ==========================================

const createCouponValidation = [

  body("code")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required")
    .isLength({ min: 3, max: 30 })
    .withMessage(
      "Coupon code must be between 3 and 30 characters"
    ),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Coupon title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage(
      "Title must be between 3 and 100 characters"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Description cannot exceed 500 characters"
    ),

  body("type")
    .notEmpty()
    .withMessage("Coupon type is required")
    .isIn([
      "percentage",
      "flat",
      "free_booking",
      "first_booking",
      "cashback",
    ])
    .withMessage("Invalid coupon type"),

  body("value")
    .notEmpty()
    .withMessage("Coupon value is required")
    .isFloat({ min: 0 })
    .withMessage(
      "Coupon value must be greater than or equal to 0"
    ),

  body("minimumBookingAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage(
      "Minimum booking amount must be at least 0"
    ),

  body("maximumDiscount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage(
      "Maximum discount must be at least 0"
    ),

  body("usageLimit")
    .optional()
    .isInt({ min: 0 })
    .withMessage(
      "Usage limit must be 0 or greater"
    ),

  body("usagePerUser")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Usage per user must be at least 1"
    ),

  body("validFrom")
    .notEmpty()
    .withMessage("Valid from date is required")
    .isISO8601()
    .withMessage("Invalid valid from date"),

  body("validUntil")
    .notEmpty()
    .withMessage("Valid until date is required")
    .isISO8601()
    .withMessage("Invalid valid until date"),

  body("applicableTurfs")
    .optional()
    .isArray()
    .withMessage(
      "Applicable turfs must be an array"
    ),

  body("applicableTurfs.*")
    .optional()
    .isMongoId()
    .withMessage(
      "Each turf ID must be a valid Mongo ID"
    ),

  body("owner")
    .optional()
    .isMongoId()
    .withMessage("Invalid owner ID"),

  body("isGlobal")
    .optional()
    .isBoolean()
    .withMessage(
      "isGlobal must be true or false"
    ),

  body("firstBookingOnly")
    .optional()
    .isBoolean()
    .withMessage(
      "firstBookingOnly must be true or false"
    ),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be true or false"
    ),

];

// ==========================================
// Update Coupon Validation
// ==========================================

const updateCouponValidation = [

  param("id")
    .isMongoId()
    .withMessage("Invalid coupon ID"),

  body("code")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage(
      "Coupon code must be between 3 and 30 characters"
    ),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage(
      "Title must be between 3 and 100 characters"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Description cannot exceed 500 characters"
    ),

  body("type")
    .optional()
    .isIn([
      "percentage",
      "flat",
      "free_booking",
      "first_booking",
      "cashback",
    ])
    .withMessage("Invalid coupon type"),

  body("value")
    .optional()
    .isFloat({ min: 0 })
    .withMessage(
      "Coupon value must be greater than or equal to 0"
    ),

  body("minimumBookingAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage(
      "Minimum booking amount must be at least 0"
    ),

  body("maximumDiscount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage(
      "Maximum discount must be at least 0"
    ),

  body("usageLimit")
    .optional()
    .isInt({ min: 0 })
    .withMessage(
      "Usage limit must be 0 or greater"
    ),

  body("usagePerUser")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Usage per user must be at least 1"
    ),

  body("validFrom")
    .optional()
    .isISO8601()
    .withMessage("Invalid valid from date"),

  body("validUntil")
    .optional()
    .isISO8601()
    .withMessage("Invalid valid until date"),

  body("applicableTurfs")
    .optional()
    .isArray()
    .withMessage(
      "Applicable turfs must be an array"
    ),

  body("applicableTurfs.*")
    .optional()
    .isMongoId()
    .withMessage(
      "Each turf ID must be a valid Mongo ID"
    ),

  body("owner")
    .optional()
    .isMongoId()
    .withMessage("Invalid owner ID"),

  body("isGlobal")
    .optional()
    .isBoolean()
    .withMessage(
      "isGlobal must be true or false"
    ),

  body("firstBookingOnly")
    .optional()
    .isBoolean()
    .withMessage(
      "firstBookingOnly must be true or false"
    ),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be true or false"
    ),

];
const { query } = require("express-validator");

// ==========================================
// Apply Coupon Validation
// ==========================================

const applyCouponValidation = [

  body("code")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required")
    .isLength({ min: 3, max: 30 })
    .withMessage(
      "Invalid coupon code"
    ),

  body("bookingAmount")
    .notEmpty()
    .withMessage("Booking amount is required")
    .isFloat({ min: 0 })
    .withMessage(
      "Booking amount must be greater than or equal to 0"
    ),

  body("turfId")
    .notEmpty()
    .withMessage("Turf ID is required")
    .isMongoId()
    .withMessage("Invalid turf ID"),

];

// ==========================================
// Validate Coupon Validation
// ==========================================

const validateCouponValidation = [

  body("code")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required"),

  body("bookingAmount")
    .notEmpty()
    .withMessage("Booking amount is required")
    .isFloat({ min: 0 })
    .withMessage(
      "Booking amount must be greater than or equal to 0"
    ),

  body("turfId")
    .optional()
    .isMongoId()
    .withMessage("Invalid turf ID"),

];

// ==========================================
// Coupon ID Validation
// ==========================================

const couponIdValidation = [

  param("id")
    .notEmpty()
    .withMessage("Coupon ID is required")
    .isMongoId()
    .withMessage("Invalid coupon ID"),

];

// ==========================================
// Delete Coupon Validation
// ==========================================

const deleteCouponValidation = [

  param("id")
    .notEmpty()
    .withMessage("Coupon ID is required")
    .isMongoId()
    .withMessage("Invalid coupon ID"),

];
// ==========================================
// Search Coupon Validation
// ==========================================

const searchCouponValidation = [

  query("code")
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage(
      "Coupon code must not exceed 30 characters"
    ),

  query("type")
    .optional()
    .isIn([
      "percentage",
      "flat",
      "free_booking",
      "first_booking",
      "cashback",
    ])
    .withMessage("Invalid coupon type"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be true or false"
    ),

  query("isGlobal")
    .optional()
    .isBoolean()
    .withMessage(
      "isGlobal must be true or false"
    ),

];

// ==========================================
// Pagination Validation
// ==========================================

const paginationValidation = [

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Page must be greater than 0"
    ),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage(
      "Limit must be between 1 and 100"
    ),

];

// ==========================================
// Admin Coupon Validation
// ==========================================

const adminCouponValidation = [

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be true or false"
    ),

  body("isGlobal")
    .optional()
    .isBoolean()
    .withMessage(
      "isGlobal must be true or false"
    ),

  body("validFrom")
    .optional()
    .isISO8601()
    .withMessage(
      "Invalid valid from date"
    ),

  body("validUntil")
    .optional()
    .isISO8601()
    .withMessage(
      "Invalid valid until date"
    ),

];

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  createCouponValidation,
  updateCouponValidation,

  applyCouponValidation,
  validateCouponValidation,

  couponIdValidation,
  deleteCouponValidation,

  searchCouponValidation,
  paginationValidation,

  adminCouponValidation,

};