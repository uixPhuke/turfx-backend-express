const { body, param } = require("express-validator");

// ==========================================
// Credit Wallet Validation
// ==========================================

const creditWalletValidation = [

  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID"),

  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 1 })
    .withMessage(
      "Amount must be greater than ₹0"
    ),

  body("type")
    .notEmpty()
    .withMessage("Transaction type is required")
    .isIn([
      "credit",
      "refund",
      "cashback",
      "reward",
      "admin_credit",
    ])
    .withMessage("Invalid transaction type"),

  body("description")
    .optional()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Description cannot exceed 500 characters"
    ),

  body("booking")
    .optional()
    .isMongoId()
    .withMessage("Invalid booking ID"),

  body("payment")
    .optional()
    .isMongoId()
    .withMessage("Invalid payment ID"),

  body("coupon")
    .optional()
    .isMongoId()
    .withMessage("Invalid coupon ID"),

];

// ==========================================
// Debit Wallet Validation
// ==========================================

const debitWalletValidation = [

  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID"),

  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 1 })
    .withMessage(
      "Amount must be greater than ₹0"
    ),

  body("type")
    .notEmpty()
    .withMessage("Transaction type is required")
    .isIn([
      "debit",
      "booking_payment",
      "withdraw",
      "admin_debit",
    ])
    .withMessage("Invalid transaction type"),

  body("description")
    .optional()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Description cannot exceed 500 characters"
    ),

  body("booking")
    .optional()
    .isMongoId()
    .withMessage("Invalid booking ID"),

  body("payment")
    .optional()
    .isMongoId()
    .withMessage("Invalid payment ID"),

];
const { query } = require("express-validator");

// ==========================================
// Wallet Payment Validation
// ==========================================

const walletPaymentValidation = [

  body("bookingId")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isMongoId()
    .withMessage("Invalid booking ID"),

  body("amount")
    .notEmpty()
    .withMessage("Payment amount is required")
    .isFloat({ min: 1 })
    .withMessage(
      "Payment amount must be greater than ₹0"
    ),

];

// ==========================================
// Refund Validation
// ==========================================

const refundValidation = [

  body("bookingId")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isMongoId()
    .withMessage("Invalid booking ID"),

  body("paymentId")
    .notEmpty()
    .withMessage("Payment ID is required")
    .isMongoId()
    .withMessage("Invalid payment ID"),

  body("amount")
    .notEmpty()
    .withMessage("Refund amount is required")
    .isFloat({ min: 1 })
    .withMessage(
      "Refund amount must be greater than ₹0"
    ),

  body("reason")
    .optional()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Reason cannot exceed 500 characters"
    ),

];

// ==========================================
// Withdraw Validation
// ==========================================

const withdrawValidation = [

  body("amount")
    .notEmpty()
    .withMessage("Withdrawal amount is required")
    .isFloat({ min: 1 })
    .withMessage(
      "Withdrawal amount must be greater than ₹0"
    ),

  body("accountNumber")
    .notEmpty()
    .withMessage("Account number is required")
    .isLength({
      min: 8,
      max: 20,
    })
    .withMessage(
      "Invalid account number"
    ),

  body("ifscCode")
    .notEmpty()
    .withMessage("IFSC code is required")
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("Invalid IFSC code"),

  body("accountHolderName")
    .notEmpty()
    .withMessage("Account holder name is required")
    .trim()
    .isLength({
      min: 3,
      max: 100,
    })
    .withMessage(
      "Account holder name must be between 3 and 100 characters"
    ),

];

// ==========================================
// Wallet ID Validation
// ==========================================

const walletIdValidation = [

  param("id")
    .notEmpty()
    .withMessage("Wallet ID is required")
    .isMongoId()
    .withMessage("Invalid wallet ID"),

];
// ==========================================
// Transfer Validation
// ==========================================

const transferValidation = [

  body("receiverId")
    .notEmpty()
    .withMessage("Receiver ID is required")
    .isMongoId()
    .withMessage("Invalid receiver ID"),

  body("amount")
    .notEmpty()
    .withMessage("Transfer amount is required")
    .isFloat({ min: 1 })
    .withMessage(
      "Transfer amount must be greater than ₹0"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Description cannot exceed 500 characters"
    ),

];

// ==========================================
// Search Wallet Validation
// ==========================================

const searchWalletValidation = [

  query("status")
    .optional()
    .isIn([
      "active",
      "frozen",
      "blocked",
    ])
    .withMessage("Invalid wallet status"),

  query("currency")
    .optional()
    .isIn([
      "INR",
      "USD",
      "EUR",
      "GBP",
    ])
    .withMessage("Invalid currency"),

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
// Admin Wallet Validation
// ==========================================

const adminWalletValidation = [

  body("status")
    .optional()
    .isIn([
      "active",
      "frozen",
      "blocked",
    ])
    .withMessage("Invalid wallet status"),

  body("rewardPoints")
    .optional()
    .isInt({ min: 0 })
    .withMessage(
      "Reward points cannot be negative"
    ),

  body("minimumWithdrawalAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage(
      "Minimum withdrawal amount cannot be negative"
    ),

  body("withdrawalEnabled")
    .optional()
    .isBoolean()
    .withMessage(
      "withdrawalEnabled must be true or false"
    ),

];

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  creditWalletValidation,
  debitWalletValidation,

  walletPaymentValidation,
  refundValidation,
  withdrawValidation,

  walletIdValidation,

  transferValidation,

  searchWalletValidation,
  paginationValidation,

  adminWalletValidation,

};