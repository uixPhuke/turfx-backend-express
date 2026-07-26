const { body, param } = require("express-validator");

// ==========================================
// Create Review Validation
// ==========================================

const createReviewValidation = [
  body("bookingId")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isMongoId()
    .withMessage("Invalid booking ID"),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),

  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Review comment is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage(
      "Comment must be between 10 and 2000 characters"
    ),
];

// ==========================================
// Update Review Validation
// ==========================================

const updateReviewValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid review ID"),

  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),

  body("comment")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage(
      "Comment must be between 10 and 2000 characters"
    ),
];
// ==========================================
// Reply Review Validation
// ==========================================

const replyReviewValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid review ID"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Reply message is required")
    .isLength({ min: 5, max: 1000 })
    .withMessage(
      "Reply must be between 5 and 1000 characters"
    ),
];

// ==========================================
// Helpful Review Validation
// ==========================================

const helpfulReviewValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid review ID"),
];

// ==========================================
// Report Review Validation
// ==========================================

const reportReviewValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid review ID"),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Report reason is required")
    .isIn([
      "spam",
      "abuse",
      "fake",
      "offensive",
      "other",
    ])
    .withMessage("Invalid report reason"),
];

// ==========================================
// Review ID Validation
// ==========================================

const reviewIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid review ID"),
];
const { query } = require("express-validator");

// ==========================================
// Search Validation
// ==========================================

const searchReviewValidation = [
  query("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  query("sort")
    .optional()
    .isIn([
      "latest",
      "oldest",
      "highest",
      "lowest",
      "helpful",
    ])
    .withMessage("Invalid sort option"),
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
// Rating Filter Validation
// ==========================================

const ratingFilterValidation = [
  query("minRating")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Minimum rating must be between 1 and 5"),

  query("maxRating")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Maximum rating must be between 1 and 5"),
];

// ==========================================
// Admin Visibility Validation
// ==========================================

const adminVisibilityValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid review ID"),

  body("isVisible")
    .isBoolean()
    .withMessage("isVisible must be true or false"),
];

// ==========================================
// Delete Review Validation
// ==========================================

const deleteReviewValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid review ID"),
];

// ==========================================
// Module Exports
// ==========================================

module.exports = {
  createReviewValidation,
  updateReviewValidation,

  replyReviewValidation,
  helpfulReviewValidation,
  reportReviewValidation,

  reviewIdValidation,

  searchReviewValidation,
  paginationValidation,
  ratingFilterValidation,

  adminVisibilityValidation,
  deleteReviewValidation,
};