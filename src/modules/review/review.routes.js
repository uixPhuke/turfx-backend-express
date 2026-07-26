// src/modules/review/review.routes.js

const express = require("express");

const router = express.Router();

const reviewController = require("./review.controller");

const {
  createReviewValidation,
  updateReviewValidation,
  replyReviewValidation,
  helpfulReviewValidation,
  reportReviewValidation,
  reviewIdValidation,
  searchReviewValidation,
  paginationValidation,
  ratingFilterValidation,
  adminVisibilityValidation,
  deleteReviewValidation,
} = require("./review.validation");

const auth = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validation.middleware");
const upload = require("../../middlewares/upload.middleware");

// ==========================================
// Public Routes
// ==========================================

// Get Turf Reviews
router.get(
  "/turf/:turfId",
  searchReviewValidation,
  ratingFilterValidation,
  paginationValidation,
  validate,
  reviewController.getTurfReviews
);

// Get Review By ID
router.get(
  "/:id",
  reviewIdValidation,
  validate,
  reviewController.getReviewById
);

// ==========================================
// User Routes
// ==========================================

// Create Review
router.post(
  "/",
  auth,
  authorize("user"),
  upload.array("images", 5),
  createReviewValidation,
  validate,
  reviewController.createReview
);

// Update Review
router.patch(
  "/:id",
  auth,
  authorize("user"),
  upload.array("images", 5),
  updateReviewValidation,
  validate,
  reviewController.updateReview
);

// Delete Review
router.delete(
  "/:id",
  auth,
  authorize("user"),
  deleteReviewValidation,
  validate,
  reviewController.deleteReview
);

// My Reviews
router.get(
  "/user/my-reviews",
  auth,
  authorize("user"),
  reviewController.getMyReviews
);

// Helpful
router.patch(
  "/:id/helpful",
  auth,
  authorize("user"),
  helpfulReviewValidation,
  validate,
  reviewController.markHelpful
);

// Report Review
router.patch(
  "/:id/report",
  auth,
  authorize("user"),
  reportReviewValidation,
  validate,
  reviewController.reportReview
);

// ==========================================
// Owner Routes
// ==========================================

// Reply
router.patch(
  "/:id/reply",
  auth,
  authorize("owner"),
  replyReviewValidation,
  validate,
  reviewController.replyToReview
);

// Update Reply
router.patch(
  "/:id/reply/update",
  auth,
  authorize("owner"),
  replyReviewValidation,
  validate,
  reviewController.updateOwnerReply
);

// Delete Reply
router.delete(
  "/:id/reply",
  auth,
  authorize("owner"),
  reviewIdValidation,
  validate,
  reviewController.deleteOwnerReply
);

// Review Statistics
router.get(
  "/owner/statistics",
  auth,
  authorize("owner"),
  reviewController.getReviewStatistics
);

// Rating Distribution
router.get(
  "/owner/distribution",
  auth,
  authorize("owner"),
  reviewController.getRatingDistribution
);

// Analytics
router.get(
  "/owner/analytics",
  auth,
  authorize("owner"),
  reviewController.getOwnerReviewAnalytics
);

// ==========================================
// Admin Routes
// ==========================================

// Hide Review
router.patch(
  "/:id/hide",
  auth,
  authorize("admin"),
  adminVisibilityValidation,
  validate,
  reviewController.hideReview
);

// Restore Review
router.patch(
  "/:id/restore",
  auth,
  authorize("admin"),
  reviewIdValidation,
  validate,
  reviewController.restoreReview
);

// Reported Reviews
router.get(
  "/admin/reported",
  auth,
  authorize("admin"),
  paginationValidation,
  validate,
  reviewController.getReportedReviews
);

// Top Rated Turfs
router.get(
  "/admin/top-rated-turfs",
  auth,
  authorize("admin"),
  reviewController.getTopRatedTurfs
);

// Most Active Reviewers
router.get(
  "/admin/top-reviewers",
  auth,
  authorize("admin"),
  reviewController.getMostActiveReviewers
);

// System Analytics
router.get(
  "/admin/analytics",
  auth,
  authorize("admin"),
  reviewController.getSystemReviewAnalytics
);

module.exports = router;