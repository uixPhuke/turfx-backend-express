const { body } = require("express-validator");

// ==========================================
// Create Notification Validation
// ==========================================

const createNotificationValidation = [

  body("receiver")
    .notEmpty()
    .withMessage("Receiver is required")
    .isMongoId()
    .withMessage("Invalid receiver ID"),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({
      min: 3,
      max: 150,
    })
    .withMessage(
      "Title must be between 3 and 150 characters"
    ),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({
      min: 5,
      max: 1000,
    })
    .withMessage(
      "Message must be between 5 and 1000 characters"
    ),

  body("type")
    .notEmpty()
    .withMessage("Notification type is required")
    .isIn([
      "booking_created",
      "booking_confirmed",
      "booking_cancelled",
      "booking_reminder",

      "payment_success",
      "payment_failed",
      "refund_processed",

      "review_received",
      "review_reply",

      "coupon",

      "owner_approved",
      "owner_rejected",

      "turf_approved",
      "turf_rejected",

      "system",
    ])
    .withMessage("Invalid notification type"),

  body("referenceType")
    .optional()
    .isIn([
      "Booking",
      "Payment",
      "Review",
      "Coupon",
      "Turf",
      "User",
      "System",
    ])
    .withMessage("Invalid reference type"),

  body("referenceId")
    .optional()
    .isMongoId()
    .withMessage("Invalid reference ID"),

  body("priority")
    .optional()
    .isIn([
      "low",
      "normal",
      "high",
      "urgent",
    ])
    .withMessage("Invalid priority"),

];

// ==========================================
// Send Notification Validation
// ==========================================

const sendNotificationValidation = [

  body("receiver")
    .isMongoId()
    .withMessage(
      "Receivers must be a non-empty array"
    ),



  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({
      min: 3,
      max: 150,
    })
    .withMessage(
      "Title must be between 3 and 150 characters"
    ),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({
      min: 5,
      max: 1000,
    })
    .withMessage(
      "Message must be between 5 and 1000 characters"
    ),

  body("type")
    .notEmpty()
    .withMessage("Notification type is required")
    .isIn([
      "booking_created",
      "booking_confirmed",
      "booking_cancelled",
      "booking_reminder",

      "payment_success",
      "payment_failed",
      "refund_processed",

      "review_received",
      "review_reply",

      "coupon",

      "owner_approved",
      "owner_rejected",

      "turf_approved",
      "turf_rejected",

      "system",
    ])
    .withMessage("Invalid notification type"),

  body("channels")
    .optional()
    .isObject()
    .withMessage("Channels must be an object"),

];
const { param } = require("express-validator");

// ==========================================
// Notification ID Validation
// ==========================================

const notificationIdValidation = [

  param("id")
    .notEmpty()
    .withMessage("Notification ID is required")
    .isMongoId()
    .withMessage("Invalid notification ID"),

];

// ==========================================
// Mark As Read Validation
// ==========================================

const markAsReadValidation = [

  param("id")
    .notEmpty()
    .withMessage("Notification ID is required")
    .isMongoId()
    .withMessage("Invalid notification ID"),

];

// ==========================================
// Mark All As Read Validation
// ==========================================

const markAllAsReadValidation = [];

// ==========================================
// Delete Notification Validation
// ==========================================

const deleteNotificationValidation = [

  param("id")
    .notEmpty()
    .withMessage("Notification ID is required")
    .isMongoId()
    .withMessage("Invalid notification ID"),

];
const { query } = require("express-validator");

// ==========================================
// Search Notification Validation
// ==========================================

const searchNotificationValidation = [

  query("type")
    .optional()
    .isIn([
      "booking_created",
      "booking_confirmed",
      "booking_cancelled",
      "booking_reminder",

      "payment_success",
      "payment_failed",
      "refund_processed",

      "review_received",
      "review_reply",

      "coupon",

      "owner_approved",
      "owner_rejected",

      "turf_approved",
      "turf_rejected",

      "system",
    ])
    .withMessage("Invalid notification type"),

  query("isRead")
    .optional()
    .isBoolean()
    .withMessage("isRead must be true or false"),

  query("priority")
    .optional()
    .isIn([
      "low",
      "normal",
      "high",
      "urgent",
    ])
    .withMessage("Invalid priority"),

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
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage(
      "Limit must be between 1 and 100"
    ),

];

// ==========================================
// Broadcast Notification Validation
// ==========================================

const broadcastNotificationValidation = [

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({
      min: 3,
      max: 150,
    })
    .withMessage(
      "Title must be between 3 and 150 characters"
    ),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({
      min: 5,
      max: 1000,
    })
    .withMessage(
      "Message must be between 5 and 1000 characters"
    ),

  body("type")
    .optional()
    .isIn([
      "system",
      "coupon",
    ])
    .withMessage(
      "Broadcast notification type must be 'system' or 'coupon'"
    ),

  body("priority")
    .optional()
    .isIn([
      "low",
      "normal",
      "high",
      "urgent",
    ])
    .withMessage("Invalid priority"),

  body("channels")
    .optional()
    .isObject()
    .withMessage(
      "Channels must be an object"
    ),

];

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  createNotificationValidation,
  sendNotificationValidation,

  notificationIdValidation,
  markAsReadValidation,
  markAllAsReadValidation,
  deleteNotificationValidation,

  searchNotificationValidation,
  paginationValidation,
  broadcastNotificationValidation,

};