const { body, param, query } = require("express-validator");

// ==========================================
// Create Turf Validation
// ==========================================

const createTurfValidation = [
  // ======================================
  // Basic Information
  // ======================================

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Turf name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Turf name must be between 3 and 100 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 20, max: 2000 })
    .withMessage("Description must be between 20 and 2000 characters"),

  // ======================================
  // Sports
  // ======================================

  body("sports")
    .isArray({ min: 1 })
    .withMessage("Select at least one sport"),

  body("sports.*")
    .isIn([
      "football",
      "cricket",
      "badminton",
      "basketball",
      "volleyball",
      "tennis",
    ])
    .withMessage("Invalid sport"),

  // ======================================
  // Pricing
  // ======================================

  body("pricing.weekday")
    .notEmpty()
    .withMessage("Weekday price is required")
    .isFloat({ min: 0 })
    .withMessage("Invalid weekday price"),

  body("pricing.weekend")
    .notEmpty()
    .withMessage("Weekend price is required")
    .isFloat({ min: 0 })
    .withMessage("Invalid weekend price"),

  body("pricing.holiday")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid holiday price"),

  // ======================================
  // Slot Duration
  // ======================================

  body("slotDuration")
    .optional()
    .isIn([30, 60, 90, 120])
    .withMessage("Invalid slot duration"),

  // ======================================
  // Capacity
  // ======================================

  body("maxPlayers")
    .optional()
    .isInt({ min: 2 })
    .withMessage("Minimum 2 players are required"),

  // ======================================
  // Working Hours
  // ======================================

  body("workingHours.is24Hours")
    .optional()
    .isBoolean()
    .withMessage("is24Hours must be boolean"),

  body("workingHours.open")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Invalid opening time"),

  body("workingHours.close")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Invalid closing time"),

  // ======================================
  // Contact
  // ======================================

  body("contact.phone")
    .trim()
    .notEmpty()
    .withMessage("Contact phone is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Invalid phone number"),

  body("contact.email")
    .optional()
    .isEmail()
    .withMessage("Invalid email"),

  // ======================================
  // Facilities
  // ======================================

  body("facilities")
    .optional()
    .isObject()
    .withMessage("Facilities must be an object"),

  // ======================================
  // Address
  // ======================================

  body("address.state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),

  body("address.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),

  body("address.area")
    .trim()
    .notEmpty()
    .withMessage("Area is required"),

  body("address.pincode")
    .trim()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage("Invalid pincode"),

  body("address.fullAddress")
    .trim()
    .notEmpty()
    .withMessage("Full address is required"),

  // ======================================
  // Location
  // ======================================

  body("location.coordinates")
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates are required"),

  body("location.coordinates.*")
    .isFloat()
    .withMessage("Invalid coordinates"),
];

// ==========================================
// Update Turf Validation
// ==========================================

const updateTurfValidation = [
  // Basic Information
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Turf name must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage("Description must be between 20 and 2000 characters"),

  // Sports
  body("sports")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Sports must be an array"),

  body("sports.*")
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

  // Pricing
  body("pricing.weekday")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid weekday price"),

  body("pricing.weekend")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid weekend price"),

  body("pricing.holiday")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid holiday price"),

  // Slot Duration
  body("slotDuration")
    .optional()
    .isIn([30, 60, 90, 120])
    .withMessage("Invalid slot duration"),

  // Capacity
  body("maxPlayers")
    .optional()
    .isInt({ min: 2 })
    .withMessage("Minimum 2 players are required"),

  // Working Hours
  body("workingHours.is24Hours")
    .optional()
    .isBoolean()
    .withMessage("is24Hours must be boolean"),

  body("workingHours.open")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Invalid opening time"),

  body("workingHours.close")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Invalid closing time"),

  // Contact
  body("contact.phone")
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Invalid phone number"),

  body("contact.email")
    .optional()
    .isEmail()
    .withMessage("Invalid email"),

  // Facilities
  body("facilities")
    .optional()
    .isObject()
    .withMessage("Facilities must be an object"),

  // Address
  body("address.state")
    .optional()
    .trim(),

  body("address.city")
    .optional()
    .trim(),

  body("address.area")
    .optional()
    .trim(),

  body("address.pincode")
    .optional()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage("Invalid pincode"),

  body("address.fullAddress")
    .optional()
    .trim(),

  // Location
  body("location.coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates are required"),

  body("location.coordinates.*")
    .optional()
    .isFloat()
    .withMessage("Invalid coordinates"),
];

// ==========================================
// Turf ID Validation
// ==========================================

const turfIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid turf id"),
];

// ==========================================
// Search Validation
// ==========================================

const searchValidation = [
  query("search")
    .optional()
    .trim(),

  query("city")
    .optional()
    .trim(),

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

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be greater than 0"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("minPrice")
    .optional()
    .isFloat({ min: 0 }),

  query("maxPrice")
    .optional()
    .isFloat({ min: 0 }),

  query("rating")
    .optional()
    .isFloat({ min: 0, max: 5 }),
];

// ==========================================
// Nearby Validation
// ==========================================

const nearbyValidation = [
  query("lat")
    .notEmpty()
    .withMessage("Latitude is required")
    .isFloat()
    .withMessage("Invalid latitude"),

  query("lng")
    .notEmpty()
    .withMessage("Longitude is required")
    .isFloat()
    .withMessage("Invalid longitude"),

  query("distance")
    .optional()
    .isInt({ min: 100 })
    .withMessage("Distance must be at least 100 meters"),
];

// ==========================================
// Approve Turf Validation
// ==========================================

const approveTurfValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid turf id"),
];

// ==========================================
// Reject Turf Validation
// ==========================================

const rejectTurfValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid turf id"),
];

// ==========================================
// Delete Turf Validation
// ==========================================

const deleteTurfValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid turf id"),
];

// ==========================================
// Module Exports
// ==========================================

module.exports = {
  createTurfValidation,
  updateTurfValidation,
  turfIdValidation,
  searchValidation,
  nearbyValidation,
  approveTurfValidation,
  rejectTurfValidation,
  deleteTurfValidation,
};