const express = require("express");

const router = express.Router();

const paymentController = require("./payment.controller");

const {
  createPaymentValidation,
  verifyPaymentValidation,
  refundPaymentValidation,
  paymentIdValidation,
  webhookValidation,
  searchPaymentsValidation,
  paginationValidation,
  dateFilterValidation,
  revenueValidation,
} = require("./payment.validation");

const auth = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validation.middleware");

const {
  paymentLimiter,
  adminLimiter,
} = require("../../middlewares/rateLimiter");

// ==========================================
// Public Route (Webhook)
// ==========================================

// Razorpay Webhook
// IMPORTANT:
// Verify Razorpay Signature inside Controller
router.post(
  "/webhook",
  webhookValidation,
  validate,
  paymentController.handleWebhook
);

// ==========================================
// User Routes
// ==========================================

// Create Payment Order
router.post(
  "/create-order",
  auth,
  authorize("user"),
  paymentLimiter,
  createPaymentValidation,
  validate,
  paymentController.createPaymentOrder
);

// Verify Payment
router.post(
  "/verify",
  auth,
  authorize("user"),
  paymentLimiter,
  verifyPaymentValidation,
  validate,
  paymentController.verifyPayment
);

// My Payments
router.get(
  "/my-payments",
  auth,
  authorize("user"),
  searchPaymentsValidation,
  paginationValidation,
  validate,
  paymentController.getMyPayments
);

// Payment Details
router.get(
  "/:id",
  auth,
  paymentIdValidation,
  validate,
  paymentController.getPaymentById
);

// ==========================================
// Owner Routes
// ==========================================

// Owner Payments
router.get(
  "/owner/all",
  auth,
  authorize("owner"),
  searchPaymentsValidation,
  paginationValidation,
  dateFilterValidation,
  validate,
  paymentController.getOwnerPayments
);

// Revenue Summary
router.get(
  "/owner/revenue",
  auth,
  authorize("owner"),
  paymentController.getRevenue
);

// Monthly Revenue
router.get(
  "/owner/revenue/monthly",
  auth,
  authorize("owner"),
  revenueValidation,
  validate,
  paymentController.getMonthlyRevenue
);

// Dashboard Statistics
router.get(
  "/owner/dashboard",
  auth,
  authorize("owner"),
  paymentController.getDashboardStatistics
);

// Settlement History
router.get(
  "/owner/settlements",
  auth,
  authorize("owner"),
  paginationValidation,
  validate,
  paymentController.getSettlementHistory
);

// Failed Payments
router.get(
  "/owner/failed",
  auth,
  authorize("owner"),
  paymentController.getFailedPayments
);

// Refund History
router.get(
  "/owner/refunds",
  auth,
  authorize("owner"),
  paymentController.getRefundHistory
);

// Transaction Report
router.get(
  "/owner/report",
  auth,
  authorize("owner"),
  dateFilterValidation,
  validate,
  paymentController.getTransactionReport
);

// Financial Summary
router.get(
  "/owner/summary",
  auth,
  authorize("owner"),
  paymentController.getFinancialSummary
);

// ==========================================
// Admin Routes
// ==========================================

// Refund Payment
router.patch(
  "/:id/refund",
  auth,
  authorize("admin"),
  adminLimiter,
  paymentIdValidation,
  refundPaymentValidation,
  validate,
  paymentController.refundPayment
);

// Cancel Payment
router.patch(
  "/:id/cancel",
  auth,
  authorize("admin"),
  adminLimiter,
  paymentIdValidation,
  validate,
  paymentController.cancelPayment
);

// System Revenue
router.get(
  "/admin/revenue",
  auth,
  authorize("admin"),
  adminLimiter,
  paymentController.getSystemRevenue
);

// Top Owners
router.get(
  "/admin/top-owners",
  auth,
  authorize("admin"),
  adminLimiter,
  paymentController.getTopOwners
);

// Top Turfs
router.get(
  "/admin/top-turfs",
  auth,
  authorize("admin"),
  adminLimiter,
  paymentController.getTopTurfs
);

module.exports = router;