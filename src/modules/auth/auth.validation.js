const { body } = require("express-validator");

/**
 * Password Validation Regex
 * Minimum 8 characters
 * At least:
 * - 1 Uppercase
 * - 1 Lowercase
 * - 1 Number
 * - 1 Special Character
 */
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * ==============================
 * Register Validation
 * ==============================
 */
const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .bail()
    .matches(/^[A-Za-z ]+$/)
    .withMessage("Name should contain only letters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .bail()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please enter a valid Indian phone number"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .matches(passwordRegex)
    .withMessage(
      "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character."
    ),

  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Confirm password is required")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

/**
 * ==============================
 * Login Validation
 * ==============================
 */
const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required"),
];

/**
 * ==============================
 * Forgot Password Validation
 * ==============================
 */
const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),
];

/**
 * ==============================
 * Verify OTP Validation
 * ==============================
 */
const verifyOtpValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .bail()
    .matches(/^\d{6}$/)
    .withMessage("OTP must be exactly 6 digits"),
];

/**
 * ==============================
 * Reset Password Validation
 * ==============================
 */
const resetPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .bail()
    .matches(/^\d{6}$/)
    .withMessage("OTP must be exactly 6 digits"),

  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .matches(passwordRegex)
    .withMessage(
      "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character."
    ),

  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Confirm password is required")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

/**
 * ==============================
 * Change Password Validation
 * ==============================
 */
const changePasswordValidation = [
  body("oldPassword")
    .trim()
    .notEmpty()
    .withMessage("Old password is required"),

  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .matches(passwordRegex)
    .withMessage(
      "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character."
    ),

  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Confirm password is required")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];
/**
 * ==============================
 * Resend Verification Validation
 * ==============================
 */
const resendVerificationValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  changePasswordValidation,
  resendVerificationValidation,
};