// src/modules/review/review.controller.js

const reviewService = require("./review.service");

const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../middlewares/async.middleware");

// ==========================================
// Create Review
// ==========================================

const createReview = asyncHandler(
  async (req, res) => {

    const review =
      await reviewService.createReview(
        req.user._id,
        req.body,
        req.files
      );

    return res.status(201).json(
      new ApiResponse(
        201,
        review,
        "Review created successfully"
      )
    );

  }
);

// ==========================================
// Update Review
// ==========================================

const updateReview = asyncHandler(
  async (req, res) => {

    let removeImages = [];

    if (req.body.removeImages) {

      removeImages = Array.isArray(
        req.body.removeImages
      )
        ? req.body.removeImages
        : [req.body.removeImages];

    }

    const review =
      await reviewService.updateReview(
        req.user._id,
        req.params.id,
        req.body,
        req.files,
        removeImages
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        review,
        "Review updated successfully"
      )
    );

  }
);

// ==========================================
// Delete Review
// ==========================================

const deleteReview = asyncHandler(
  async (req, res) => {

    const result =
      await reviewService.deleteReview(
        req.user._id,
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Review deleted successfully"
      )
    );

  }
);
// ==========================================
// Get Review By ID
// ==========================================

const getReviewById = asyncHandler(
  async (req, res) => {

    const review =
      await reviewService.getReviewById(
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        review,
        "Review fetched successfully"
      )
    );

  }
);

// ==========================================
// Get Turf Reviews
// ==========================================

const getTurfReviews = asyncHandler(
  async (req, res) => {

    const reviews =
      await reviewService.getTurfReviews(
        req.params.turfId,
        req.query
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        reviews,
        "Turf reviews fetched successfully"
      )
    );

  }
);

// ==========================================
// Get My Reviews
// ==========================================

const getMyReviews = asyncHandler(
  async (req, res) => {

    const reviews =
      await reviewService.getMyReviews(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        reviews,
        "Your reviews fetched successfully"
      )
    );

  }
);

// ==========================================
// Reply To Review
// ==========================================

const replyToReview = asyncHandler(
  async (req, res) => {

    const review =
      await reviewService.replyToReview(
        req.user._id,
        req.params.id,
        req.body.message
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        review,
        "Reply added successfully"
      )
    );

  }
);

// ==========================================
// Update Owner Reply
// ==========================================

const updateOwnerReply = asyncHandler(
  async (req, res) => {

    const review =
      await reviewService.updateOwnerReply(
        req.user._id,
        req.params.id,
        req.body.message
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        review,
        "Reply updated successfully"
      )
    );

  }
);

// ==========================================
// Delete Owner Reply
// ==========================================

const deleteOwnerReply = asyncHandler(
  async (req, res) => {

    const result =
      await reviewService.deleteOwnerReply(
        req.user._id,
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Reply deleted successfully"
      )
    );

  }
);
// ==========================================
// Mark Helpful
// ==========================================

const markHelpful = asyncHandler(
  async (req, res) => {

    const result =
      await reviewService.markHelpful(
        req.user._id,
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Review updated successfully"
      )
    );

  }
);

// ==========================================
// Report Review
// ==========================================

const reportReview = asyncHandler(
  async (req, res) => {

    const result =
      await reviewService.reportReview(
        req.user._id,
        req.params.id,
        req.body.reason
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Review reported successfully"
      )
    );

  }
);

// ==========================================
// Hide Review (Admin)
// ==========================================

const hideReview = asyncHandler(
  async (req, res) => {

    const review =
      await reviewService.hideReview(
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        review,
        "Review hidden successfully"
      )
    );

  }
);

// ==========================================
// Restore Review (Admin)
// ==========================================

const restoreReview = asyncHandler(
  async (req, res) => {

    const review =
      await reviewService.restoreReview(
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        review,
        "Review restored successfully"
      )
    );

  }
);

// ==========================================
// Reported Reviews (Admin)
// ==========================================

const getReportedReviews = asyncHandler(
  async (req, res) => {

    const reviews =
      await reviewService.getReportedReviews(
        req.query
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        reviews,
        "Reported reviews fetched successfully"
      )
    );

  }
);

// ==========================================
// Review Statistics
// ==========================================

const getReviewStatistics = asyncHandler(
  async (req, res) => {

    const stats =
      await reviewService.getReviewStatistics(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        stats,
        "Review statistics fetched successfully"
      )
    );

  }
);

// ==========================================
// Rating Distribution
// ==========================================

const getRatingDistribution = asyncHandler(
  async (req, res) => {

    const distribution =
      await reviewService.getRatingDistribution(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        distribution,
        "Rating distribution fetched successfully"
      )
    );

  }
);

// ==========================================
// Owner Review Analytics
// ==========================================

const getOwnerReviewAnalytics = asyncHandler(
  async (req, res) => {

    const analytics =
      await reviewService.getOwnerReviewAnalytics(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        analytics,
        "Review analytics fetched successfully"
      )
    );

  }
);

// ==========================================
// Top Rated Turfs (Admin)
// ==========================================

const getTopRatedTurfs = asyncHandler(
  async (req, res) => {

    const turfs =
      await reviewService.getTopRatedTurfs(
        req.query.limit
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        turfs,
        "Top rated turfs fetched successfully"
      )
    );

  }
);

// ==========================================
// Most Active Reviewers (Admin)
// ==========================================

const getMostActiveReviewers = asyncHandler(
  async (req, res) => {

    const reviewers =
      await reviewService.getMostActiveReviewers(
        req.query.limit
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        reviewers,
        "Most active reviewers fetched successfully"
      )
    );

  }
);

// ==========================================
// System Review Analytics (Admin)
// ==========================================

const getSystemReviewAnalytics = asyncHandler(
  async (req, res) => {

    const analytics =
      await reviewService.getSystemReviewAnalytics();

    return res.status(200).json(
      new ApiResponse(
        200,
        analytics,
        "System review analytics fetched successfully"
      )
    );

  }
);

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  // User
  createReview,
  updateReview,
  deleteReview,

  getReviewById,
  getTurfReviews,
  getMyReviews,

  markHelpful,
  reportReview,

  // Owner
  replyToReview,
  updateOwnerReply,
  deleteOwnerReply,

  getReviewStatistics,
  getRatingDistribution,
  getOwnerReviewAnalytics,

  // Admin
  hideReview,
  restoreReview,
  getReportedReviews,

  getTopRatedTurfs,
  getMostActiveReviewers,
  getSystemReviewAnalytics,

};