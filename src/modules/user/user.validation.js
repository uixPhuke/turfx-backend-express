const { body, param } = require("express-validator");

// ==========================================
// Update Profile
// ==========================================

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[A-Za-z ]+$/)
    .withMessage("Name should contain only letters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please enter a valid Indian phone number"),

  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Invalid date of birth"),

  body("address.state")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("State name is too long"),

  body("address.city")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("City name is too long"),

  body("address.area")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Area name is too long"),

  body("address.pincode")
    .optional()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("Invalid pincode"),
];

// ==========================================
// Update Avatar
// ==========================================

const updateAvatarValidation = [];

// ==========================================
// Delete Account
// ==========================================

const deleteAccountValidation = [
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required"),
];

// ==========================================
// User ID Validation
// ==========================================

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user id"),
];

// ==========================================
// Change Role
// ==========================================

const changeRoleValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user id"),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["user", "owner", "admin"])
    .withMessage("Invalid role"),
];

// ==========================================
// Block User
// ==========================================

const blockUserValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user id"),
];

// ==========================================
// Unblock User
// ==========================================

const unblockUserValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user id"),
];

// ==========================================
// Approve Owner
// ==========================================

const approveOwnerValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid owner id"),
];

// ==========================================
// Reject Owner
// ==========================================

const rejectOwnerValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid owner id"),
];

// ==========================================
// Restore User
// ==========================================

const restoreUserValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user id"),
];

// ==========================================
// Permanent Delete User
// ==========================================

const permanentDeleteValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user id"),
];

module.exports = {
  updateProfileValidation,
  updateAvatarValidation,
  deleteAccountValidation,

  userIdValidation,

  changeRoleValidation,

  blockUserValidation,
  unblockUserValidation,

  approveOwnerValidation,
  rejectOwnerValidation,

  restoreUserValidation,
  permanentDeleteValidation,
};