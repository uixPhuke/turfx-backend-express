// src/modules/admin/admin.validation.js

const {
  body,
} = require("express-validator");

// ==========================================
// Common Constants
// ==========================================

const ADMIN_ROLES = [

  "super_admin",

  "admin",

  "support",

  "finance",

  "moderator",

  "operations",

];

// ==========================================
// Register Admin Validation
// ==========================================

const registerAdminValidation = [

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Name must be between 2 and 100 characters"
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({
      min: 8,
    })
    .withMessage(
      "Password must be at least 8 characters long"
    )
    .matches(/[A-Z]/)
    .withMessage(
      "Password must contain at least one uppercase letter"
    )
    .matches(/[a-z]/)
    .withMessage(
      "Password must contain at least one lowercase letter"
    )
    .matches(/[0-9]/)
    .withMessage(
      "Password must contain at least one number"
    )
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage(
      "Password must contain at least one special character"
    ),

  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage(
      "Invalid phone number"
    ),

  body("designation")
    .optional()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Designation cannot exceed 100 characters"
    ),

  body("department")
    .optional()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Department cannot exceed 100 characters"
    ),

];

// ==========================================
// Login Admin Validation
// ==========================================

const loginAdminValidation = [

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),

];

// ==========================================
// Create Admin Validation
// ==========================================

const createAdminValidation = [

  ...registerAdminValidation,

  body("role")
    .optional()
    .isIn(
      ADMIN_ROLES
    )
    .withMessage(
      "Invalid admin role"
    ),

];
const {
  param,
} = require("express-validator");

// ==========================================
// Update Admin Validation
// ==========================================

const updateAdminValidation = [

  body("name")
    .optional()
    .trim()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Name must be between 2 and 100 characters"
    ),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage(
      "Invalid phone number"
    ),

  body("designation")
    .optional()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Designation cannot exceed 100 characters"
    ),

  body("department")
    .optional()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Department cannot exceed 100 characters"
    ),

  body("profile.avatar")
    .optional()
    .trim()
    .isURL()
    .withMessage(
      "Invalid avatar URL"
    ),

];

// ==========================================
// Change Password Validation
// ==========================================

const changePasswordValidation = [

  body("currentPassword")
    .notEmpty()
    .withMessage(
      "Current password is required"
    ),

  body("newPassword")
    .notEmpty()
    .withMessage(
      "New password is required"
    )
    .isLength({
      min: 8,
    })
    .withMessage(
      "Password must be at least 8 characters long"
    )
    .matches(/[A-Z]/)
    .withMessage(
      "Password must contain at least one uppercase letter"
    )
    .matches(/[a-z]/)
    .withMessage(
      "Password must contain at least one lowercase letter"
    )
    .matches(/[0-9]/)
    .withMessage(
      "Password must contain at least one number"
    )
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage(
      "Password must contain at least one special character"
    ),

  /*body("confirmPassword")
    .notEmpty()
    .withMessage(
      "Confirm password is required"
    )
    .custom(
      (value, { req }) => {

        if (
          value !==
          req.body.newPassword
        ) {

          throw new Error(
            "Passwords do not match"
          );

        }

        return true;

      }
    ),
*/
];

// ==========================================
// Reset Password Validation
// ==========================================

const resetPasswordValidation = [

  body("email")
    .trim()
    .notEmpty()
    .withMessage(
      "Email is required"
    )
    .isEmail()
    .withMessage(
      "Invalid email address"
    )
    .normalizeEmail(),

  body("password")
    .optional()
    .isLength({
      min: 8,
    })
    .withMessage(
      "Password must be at least 8 characters long"
    )
    .matches(/[A-Z]/)
    .withMessage(
      "Password must contain at least one uppercase letter"
    )
    .matches(/[a-z]/)
    .withMessage(
      "Password must contain at least one lowercase letter"
    )
    .matches(/[0-9]/)
    .withMessage(
      "Password must contain at least one number"
    )
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage(
      "Password must contain at least one special character"
    ),

  body("token")
    .optional()
    .trim(),

];

// ==========================================
// Admin ID Validation
// ==========================================

const adminIdValidation = [

  param("id")
    .notEmpty()
    .withMessage(
      "Admin ID is required"
    )
    .isMongoId()
    .withMessage(
      "Invalid Admin ID"
    ),

];
const { query } = require("express-validator");

// ==========================================
// Update Role Validation
// ==========================================

const updateRoleValidation = [

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(ADMIN_ROLES)
    .withMessage("Invalid admin role"),

];

// ==========================================
// Update Permissions Validation
// ==========================================

const updatePermissionsValidation = [

  body("permissions")
    .notEmpty()
    .withMessage("Permissions are required")
    .isObject()
    .withMessage("Permissions must be an object"),

];

// ==========================================
// Toggle Status Validation
// ==========================================

const toggleStatusValidation = [

  body("isActive")
    .notEmpty()
    .withMessage("Status is required")
    .isBoolean()
    .withMessage("isActive must be true or false"),

];

// ==========================================
// Search Admin Validation
// ==========================================

const searchAdminValidation = [

  query("search")
    .optional()
    .trim()
    .isLength({
      min: 1,
      max: 100,
    })
    .withMessage(
      "Search must be between 1 and 100 characters"
    ),

  query("role")
    .optional()
    .isIn(ADMIN_ROLES)
    .withMessage("Invalid admin role"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be true or false"
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

  query("sortBy")
    .optional()
    .isIn([
      "name",
      "email",
      "role",
      "createdAt",
      "lastLoginAt",
    ])
    .withMessage("Invalid sort field"),

  query("sortOrder")
    .optional()
    .isIn([
      "asc",
      "desc",
    ])
    .withMessage(
      "sortOrder must be asc or desc"
    ),

];

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  // Authentication
  registerAdminValidation,
  loginAdminValidation,

  // Admin Management
  createAdminValidation,
  updateAdminValidation,

  // Password
  changePasswordValidation,
  resetPasswordValidation,

  // Role & Permissions
  updateRoleValidation,
  updatePermissionsValidation,

  // Status
  toggleStatusValidation,

  // Params
  adminIdValidation,

  // Search
  searchAdminValidation,
  paginationValidation,

};