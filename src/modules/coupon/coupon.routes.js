// src/modules/coupon/coupon.routes.js

const express = require("express");

const router = express.Router();

const couponController = require("./coupon.controller");

const {
  createCouponValidation,
  updateCouponValidation,
  applyCouponValidation,
  validateCouponValidation,
  couponIdValidation,
  deleteCouponValidation,
  searchCouponValidation,
  paginationValidation,
  adminCouponValidation,
} = require("./coupon.validation");

const auth = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validation.middleware");

// ======================================================
// Public / Authenticated User Routes
// ======================================================

// Get Available Coupons
router.get(
  "/",
  auth,
  searchCouponValidation,
  paginationValidation,
  validate,
  couponController.getAvailableCoupons
);

// Coupon Statistics
router.get(
  "/statistics",
  auth,
  couponController.getCouponStatistics
);

// Top Coupons
router.get(
  "/top",
  auth,
  couponController.getTopCoupons
);

// Coupon By ID
router.get(
  "/:id",
  auth,
  couponIdValidation,
  validate,
  couponController.getCouponById
);

// Validate Coupon
router.post(
  "/validate",
  auth,
  validateCouponValidation,
  validate,
  couponController.validateCoupon
);

// Apply Coupon
router.post(
  "/apply",
  auth,
  applyCouponValidation,
  validate,
  couponController.applyCoupon
);

// Remove Coupon
router.post(
  "/remove",
  auth,
  couponController.removeCoupon
);

// ======================================================
// Owner Routes
// ======================================================

// Create Coupon
router.post(
  "/",
  auth,
  authorize("owner", "admin"),
  createCouponValidation,
  validate,
  couponController.createCoupon
);

// Owner Coupons
router.get(
  "/owner/list",
  auth,
  authorize("owner", "admin"),
  paginationValidation,
  validate,
  couponController.getOwnerCoupons
);

// Update Coupon
router.patch(
  "/:id",
  auth,
  authorize("owner", "admin"),
  updateCouponValidation,
  validate,
  couponController.updateCoupon
);

// Toggle Coupon Status
router.patch(
  "/:id/toggle",
  auth,
  authorize("owner", "admin"),
  couponIdValidation,
  validate,
  couponController.toggleCouponStatus
);

// Delete Coupon
router.delete(
  "/:id",
  auth,
  authorize("owner", "admin"),
  deleteCouponValidation,
  validate,
  couponController.deleteCoupon
);

// Coupon Usage Report
router.get(
  "/owner/report",
  auth,
  authorize("owner", "admin"),
  couponController.getCouponUsageReport
);

// ======================================================
// Admin Routes
// ======================================================

// Analytics
router.get(
  "/admin/analytics",
  auth,
  authorize("admin"),
  couponController.getCouponAnalytics
);

// Expire Coupons
router.post(
  "/admin/expire",
  auth,
  authorize("admin"),
  couponController.expireCoupons
);

// Admin Update
router.patch(
  "/admin/:id",
  auth,
  authorize("admin"),
  couponIdValidation,
  adminCouponValidation,
  validate,
  couponController.updateCoupon
);

// Admin Delete
router.delete(
  "/admin/:id",
  auth,
  authorize("admin"),
  couponIdValidation,
  validate,
  couponController.deleteCoupon
);

module.exports = router;