const { body, param, query } = require("express-validator");

// ==========================================
// Get Available Slots Validation
// ==========================================

const getAvailableSlotsValidation = [
  query("turf")
    .notEmpty()
    .withMessage("Turf ID is required")
    .isMongoId()
    .withMessage("Invalid turf ID"),

  query("date")
    .notEmpty()
    .withMessage("Booking date is required")
    .isISO8601()
    .withMessage("Invalid booking date"),
];

// ==========================================
// Block Slot Validation
// ==========================================

const blockSlotValidation = [
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

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Reason cannot exceed 300 characters"),
];

// ==========================================
// Unblock Slot Validation
// ==========================================

const unblockSlotValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid slot ID"),
];

// ==========================================
// Slot ID Validation
// ==========================================

const slotIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid slot ID"),
];

// ==========================================
// Turf Slots Validation
// ==========================================

const turfSlotsValidation = [
  param("turfId")
    .isMongoId()
    .withMessage("Invalid turf ID"),
];

// ==========================================
// Slots By Date Validation
// ==========================================

const slotsByDateValidation = [
  param("turfId")
    .isMongoId()
    .withMessage("Invalid turf ID"),

  query("date")
    .notEmpty()
    .withMessage("Booking date is required")
    .isISO8601()
    .withMessage("Invalid booking date"),
];

// ==========================================
// Module Exports
// ==========================================

module.exports = {
  getAvailableSlotsValidation,

  blockSlotValidation,
  unblockSlotValidation,

  slotIdValidation,

  turfSlotsValidation,
  slotsByDateValidation,
};