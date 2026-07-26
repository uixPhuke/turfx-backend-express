// src/modules/wallet/wallet.routes.js

const express = require("express");

const router = express.Router();

const walletController = require("./wallet.controller");

const {
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
} = require("./wallet.validation");

const auth = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validation.middleware");

// ======================================================
// User Routes
// ======================================================

// Get Wallet
router.get(
  "/",
  auth,
  walletController.getWallet
);

// Create Wallet
router.post(
  "/",
  auth,
  walletController.createWallet
);

// Wallet Statistics
router.get(
  "/statistics",
  auth,
  walletController.getWalletStatistics
);

// Transaction History
router.get(
  "/transactions",
  auth,
  searchWalletValidation,
  paginationValidation,
  validate,
  walletController.getTransactionHistory
);

// Wallet Payment
router.post(
  "/pay",
  auth,
  walletPaymentValidation,
  validate,
  walletController.walletPayment
);

// Wallet Transfer
router.post(
  "/transfer",
  auth,
  transferValidation,
  validate,
  walletController.transferBalance
);

// Withdraw
router.post(
  "/withdraw",
  auth,
  withdrawValidation,
  validate,
  walletController.debitWallet
);

// ======================================================
// Admin Routes
// ======================================================

// Credit Wallet
router.post(
  "/admin/credit",
  auth,
  authorize("admin"),
  creditWalletValidation,
  validate,
  walletController.creditWallet
);

// Debit Wallet
router.post(
  "/admin/debit",
  auth,
  authorize("admin"),
  debitWalletValidation,
  validate,
  walletController.debitWallet
);

// Refund To Wallet
router.post(
  "/admin/refund",
  auth,
  authorize("admin"),
  refundValidation,
  validate,
  walletController.refundToWallet
);

// Cashback
router.post(
  "/admin/cashback",
  auth,
  authorize("admin"),
  creditWalletValidation,
  validate,
  walletController.cashbackToWallet
);

// Get Wallet By User
router.get(
  "/admin/user/:userId",
  auth,
  authorize("admin"),
  walletController.getWalletByUserId
);

// Freeze Balance
router.patch(
  "/admin/:userId/freeze",
  auth,
  authorize("admin"),
  walletController.freezeBalance
);

// Unfreeze Balance
router.patch(
  "/admin/:userId/unfreeze",
  auth,
  authorize("admin"),
  walletController.unfreezeBalance
);

// Toggle Wallet Status
router.patch(
  "/admin/:userId/status",
  auth,
  authorize("admin"),
  adminWalletValidation,
  validate,
  walletController.toggleWalletStatus
);

// Wallet Analytics
router.get(
  "/admin/analytics",
  auth,
  authorize("admin"),
  walletController.getWalletAnalytics
);

// Top Wallets
router.get(
  "/admin/top",
  auth,
  authorize("admin"),
  walletController.getTopWallets
);

// Transaction Report
router.get(
  "/admin/report",
  auth,
  authorize("admin"),
  walletController.getTransactionReport
);

// Delete Wallet
router.delete(
  "/admin/:userId",
  auth,
  authorize("admin"),
  walletController.deleteWallet
);

module.exports = router;