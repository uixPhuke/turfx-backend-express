const Review = require("./review.model");
const Booking = require("../booking/booking.model");
const Turf = require("../turf/turf.model");

const ApiError = require("../../utils/ApiError");

const {
  uploadToCloudinary,
} = require("../../config/cloudinary");

// ==========================================
// Upload Review Images
// ==========================================

const uploadImages = async (
  files = []
) => {

  const images = [];

  for (const file of files) {

    const uploaded =
      await uploadToCloudinary(
        file.buffer,
        "turfx/reviews"
      );

    images.push({
      public_id:
        uploaded.public_id,
      url:
        uploaded.secure_url,
    });

  }

  return images;

};

// ==========================================
// Create Review
// ==========================================

const createReview = async (
  userId,
  data,
  files = []
) => {

  const {
    bookingId,
    rating,
    title,
    comment,
  } = data;

  // ========================================
  // Booking
  // ========================================

  const booking =
    await Booking.findById(
      bookingId
    )
      .populate("turf")
      .populate("owner");

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found"
    );
  }

  // ========================================
  // Ownership
  // ========================================

  if (
    booking.user.toString() !==
    userId.toString()
  ) {
    throw new ApiError(
      403,
      "You can review only your own bookings"
    );
  }

  // ========================================
  // Booking Status
  // ========================================

  if (
    booking.bookingStatus !==
    "completed"
  ) {
    throw new ApiError(
      400,
      "You can review only completed bookings"
    );
  }

  // ========================================
  // Already Reviewed
  // ========================================

  if (
    booking.isReviewed
  ) {
    throw new ApiError(
      409,
      "This booking has already been reviewed"
    );
  }
    // ========================================
  // Duplicate Review Check
  // ========================================

  const existingReview =
    await Review.findOne({
      booking: booking._id,
      isDeleted: false,
    });

  if (existingReview) {
    throw new ApiError(
      409,
      "Review already exists for this booking"
    );
  }

  // ========================================
  // Upload Images
  // ========================================

  const images =
    await uploadImages(files);

  // ========================================
  // Create Review
  // ========================================

  const review =
    await Review.create({

      user: userId,

      booking: booking._id,

      turf: booking.turf._id,

      owner: booking.owner._id,

      rating,

      title,

      comment,

      images,

    });

  // ========================================
  // Update Booking
  // ========================================

  booking.isReviewed = true;

  booking.review = review._id;

  await booking.save();

  // ========================================
  // Update Turf Rating
  // ========================================

  await Review.updateTurfRating(
    booking.turf._id
  );

  return review;

};

const {
  deleteFromCloudinary,
} = require("../../config/cloudinary");

// ==========================================
// Update Review
// ==========================================

const updateReview = async (
  userId,
  reviewId,
  data,
  files = [],
  removeImages = []
) => {

  const review =
    await Review.findById(reviewId);

  if (
    !review ||
    review.isDeleted
  ) {
    throw new ApiError(
      404,
      "Review not found"
    );
  }

  // Owner Check

  if (
    review.user.toString() !==
    userId.toString()
  ) {
    throw new ApiError(
      403,
      "You are not allowed to update this review"
    );
  }

  // ========================================
  // Remove Images
  // ========================================

  if (
    removeImages.length > 0
  ) {

    for (const publicId of removeImages) {
      if (!review.images.some((image) => image.public_id === publicId)) {
        throw new ApiError(400, "Image does not belong to this review");
      }
    }
    for (const publicId of removeImages) {

      await deleteFromCloudinary(
        publicId
      );

      review.images =
        review.images.filter(
          (img) =>
            img.public_id !==
            publicId
        );

    }

  }

  // ========================================
  // Upload New Images
  // ========================================

  if (
    files &&
    files.length > 0
  ) {

    const uploadedImages =
      await uploadImages(files);

    review.images.push(
      ...uploadedImages
    );

  }

  // ========================================
  // Update Fields
  // ========================================

  if (
    data.rating !== undefined
  ) {
    review.rating =
      data.rating;
  }

  if (
    data.title !== undefined
  ) {
    review.title =
      data.title;
  }

  if (
    data.comment !== undefined
  ) {
    review.comment =
      data.comment;
  }

  await review.save();

  // Update Turf Rating

  await Review.updateTurfRating(
    review.turf
  );

  return review;

};

// ==========================================
// Delete Review
// ==========================================

const deleteReview = async (
  userId,
  reviewId
) => {

  const review =
    await Review.findById(
      reviewId
    );

  if (
    !review ||
    review.isDeleted
  ) {
    throw new ApiError(
      404,
      "Review not found"
    );
  }

  // Owner Check

  if (
    review.user.toString() !==
    userId.toString()
  ) {
    throw new ApiError(
      403,
      "You are not allowed to delete this review"
    );
  }

  // ========================================
  // Delete Images
  // ========================================

  for (const image of review.images) {

    await deleteFromCloudinary(
      image.public_id
    );

  }

  // ========================================
  // Soft Delete
  // ========================================

  review.isDeleted = true;

  await review.save();

  // ========================================
  // Update Booking
  // ========================================

  const booking =
    await Booking.findById(
      review.booking
    );

  if (booking) {

    booking.isReviewed =
      false;

    booking.review =
      null;

    await booking.save();

  }

  // ========================================
  // Update Turf Rating
  // ========================================

  await Review.updateTurfRating(
    review.turf
  );

  return {
    success: true,
  };

};

// ==========================================
// Get Review By ID
// ==========================================

const getReviewById = async (
  reviewId
) => {

  const review =
    await Review.findOne({

      _id: reviewId,

      isDeleted: false,

      isVisible: true,

    })
      .populate(
        "user",
        "name avatar"
      )
      .populate(
        "owner",
        "name"
      )
      .populate(
        "turf",
        "name images"
      );

  if (!review) {
    throw new ApiError(
      404,
      "Review not found"
    );
  }

  return review;

};

// ==========================================
// Get Turf Reviews
// ==========================================

const getTurfReviews = async (
  turfId,
  query = {}
) => {

  const {
    page = 1,
    limit = 10,
    rating,
    sort = "latest",
  } = query;

  const filter = {

    turf: turfId,

    isDeleted: false,

    isVisible: true,

  };

  if (rating) {

    filter.rating =
      Number(rating);

  }

  let sortOption = {
    createdAt: -1,
  };

  switch (sort) {

    case "oldest":
      sortOption = {
        createdAt: 1,
      };
      break;

    case "highest":
      sortOption = {
        rating: -1,
      };
      break;

    case "lowest":
      sortOption = {
        rating: 1,
      };
      break;

    case "helpful":
      sortOption = {
        helpfulCount: -1,
      };
      break;

    default:
      sortOption = {
        createdAt: -1,
      };

  }

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const reviews =
    await Review.find(filter)
      .populate(
        "user",
        "name avatar"
      )
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

  const total =
    await Review.countDocuments(
      filter
    );

  return {

    reviews,

    pagination: {

      total,

      page:
        Number(page),

      limit:
        Number(limit),

      pages:
        Math.ceil(
          total /
            Number(limit)
        ),

    },

  };

};

// ==========================================
// Get My Reviews
// ==========================================

const getMyReviews = async (
  userId
) => {

  const reviews =
    await Review.find({

      user: userId,

      isDeleted: false,

    })
      .populate(
        "turf",
        "name images"
      )
      .populate(
        "booking",
        "bookingNumber bookingDate"
      )
      .sort({
        createdAt: -1,
      });

  return reviews;

};
// ==========================================
// Reply To Review
// ==========================================

const replyToReview = async (
  ownerId,
  reviewId,
  message
) => {

  const review = await Review.findById(reviewId);

  if (!review || review.isDeleted) {
    throw new ApiError(
      404,
      "Review not found"
    );
  }

  // Only Turf Owner Can Reply

  if (
    review.owner.toString() !== ownerId.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to reply to this review"
    );
  }

  if (review.ownerReply) {
    throw new ApiError(
      400,
      "Owner has already replied to this review"
    );
  }

  review.ownerReply = {
    message,
    repliedAt: new Date(),
  };

  await review.save();

  return review;

};

// ==========================================
// Update Owner Reply
// ==========================================

const updateOwnerReply = async (
  ownerId,
  reviewId,
  message
) => {

  const review = await Review.findById(reviewId);

  if (!review || review.isDeleted) {
    throw new ApiError(
      404,
      "Review not found"
    );
  }

  if (
    review.owner.toString() !== ownerId.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to update this reply"
    );
  }

  if (!review.ownerReply) {
    throw new ApiError(
      404,
      "Reply not found"
    );
  }

  review.ownerReply.message = message;
  review.ownerReply.repliedAt = new Date();

  await review.save();

  return review;

};

// ==========================================
// Delete Owner Reply
// ==========================================

const deleteOwnerReply = async (
  ownerId,
  reviewId
) => {

  const review = await Review.findById(reviewId);

  if (!review || review.isDeleted) {
    throw new ApiError(
      404,
      "Review not found"
    );
  }

  if (
    review.owner.toString() !== ownerId.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to delete this reply"
    );
  }

  if (!review.ownerReply) {
    throw new ApiError(
      404,
      "Reply not found"
    );
  }

  review.ownerReply = null;

  await review.save();

  return {
    success: true,
  };

};

// ==========================================
// Mark Review Helpful
// ==========================================

const markHelpful = async (
  userId,
  reviewId
) => {

  const review = await Review.findById(reviewId);

  if (!review || review.isDeleted || !review.isVisible) {
    throw new ApiError(
      404,
      "Review not found"
    );
  }

  // Prevent owner from marking own review

  if (
    review.user.toString() === userId.toString()
  ) {
    throw new ApiError(
      400,
      "You cannot mark your own review as helpful"
    );
  }

  const alreadyMarked =
    review.helpfulBy.some(
      (id) =>
        id.toString() === userId.toString()
    );

  if (alreadyMarked) {

    // Toggle Helpful (Remove)

    review.helpfulBy =
      review.helpfulBy.filter(
        (id) =>
          id.toString() !== userId.toString()
      );

    review.helpfulCount = Math.max(
      0,
      review.helpfulCount - 1
    );

  } else {

    review.helpfulBy.push(userId);

    review.helpfulCount += 1;

  }

  await review.save();

  return {

    helpfulCount:
      review.helpfulCount,

    isHelpful:
      !alreadyMarked,

  };

};

// ==========================================
// Report Review
// ==========================================

const reportReview = async (
  userId,
  reviewId,
  reason
) => {

  const review = await Review.findById(reviewId);

  if (!review || review.isDeleted) {
    throw new ApiError(
      404,
      "Review not found"
    );
  }

  // Prevent Duplicate Report

  const alreadyReported =
    review.reports.some(
      (report) =>
        report.user.toString() ===
        userId.toString()
    );

  if (alreadyReported) {
    throw new ApiError(
      409,
      "You have already reported this review"
    );
  }

  review.reports.push({

    user: userId,

    reason,

    reportedAt: new Date(),

  });

  await review.save();

  return {

    success: true,

    message:
      "Review reported successfully",

  };

};

// ==========================================
// Hide Review (Admin)
// ==========================================

const hideReview = async (
  reviewId
) => {

  const review =
    await Review.findById(reviewId);

  if (
    !review ||
    review.isDeleted
  ) {
    throw new ApiError(
      404,
      "Review not found"
    );
  }

  if (!review.isVisible) {
    throw new ApiError(
      400,
      "Review is already hidden"
    );
  }

  review.isVisible = false;

  await review.save();

  // Update Turf Rating

  await Review.updateTurfRating(
    review.turf
  );

  return review;

};

// ==========================================
// Restore Review (Admin)
// ==========================================

const restoreReview = async (
  reviewId
) => {

  const review =
    await Review.findById(reviewId);

  if (
    !review ||
    review.isDeleted
  ) {
    throw new ApiError(
      404,
      "Review not found"
    );
  }

  if (review.isVisible) {
    throw new ApiError(
      400,
      "Review is already visible"
    );
  }

  review.isVisible = true;

  await review.save();

  // Update Turf Rating

  await Review.updateTurfRating(
    review.turf
  );

  return review;

};

// ==========================================
// Get Reported Reviews (Admin)
// ==========================================

const getReportedReviews =
  async (query = {}) => {

    const {
      page = 1,
      limit = 10,
    } = query;

    const skip =
      (Number(page) - 1) *
      Number(limit);

    const filter = {

      "reports.0": {
        $exists: true,
      },

      isDeleted: false,

    };

    const reviews =
      await Review.find(filter)
        .populate(
          "user",
          "name avatar"
        )
        .populate(
          "owner",
          "name"
        )
        .populate(
          "turf",
          "name"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(Number(limit));

    const total =
      await Review.countDocuments(
        filter
      );

    return {

      reviews,

      pagination: {

        total,

        page:
          Number(page),

        limit:
          Number(limit),

        pages:
          Math.ceil(
            total /
              Number(limit)
          ),

      },

    };

};

// ==========================================
// Review Statistics
// ==========================================

const getReviewStatistics = async (
  ownerId
) => {

  const stats =
    await Review.aggregate([
      {
        $match: {
          owner: ownerId,
          isDeleted: false,
          isVisible: true,
        },
      },
      {
        $group: {
          _id: null,

          totalReviews: {
            $sum: 1,
          },

          averageRating: {
            $avg: "$rating",
          },

          totalHelpfulVotes: {
            $sum: "$helpfulCount",
          },

          repliedReviews: {
            $sum: {
              $cond: [
                {
                  $ne: [
                    "$ownerReply",
                    null,
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

  return (
    stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      totalHelpfulVotes: 0,
      repliedReviews: 0,
    }
  );

};

// ==========================================
// Rating Distribution
// ==========================================

const getRatingDistribution =
  async (ownerId) => {

    const distribution =
      await Review.aggregate([
        {
          $match: {
            owner: ownerId,
            isDeleted: false,
            isVisible: true,
          },
        },
        {
          $group: {
            _id: "$rating",

            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
      ]);

    const result = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    distribution.forEach(
      (item) => {
        result[item._id] =
          item.count;
      }
    );

    return result;

};

// ==========================================
// Owner Review Analytics
// ==========================================

const getOwnerReviewAnalytics =
  async (ownerId) => {

    const statistics =
      await getReviewStatistics(
        ownerId
      );

    const ratingDistribution =
      await getRatingDistribution(
        ownerId
      );

    const monthlyReviews =
      await Review.aggregate([
        {
          $match: {
            owner: ownerId,
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: {
              year: {
                $year:
                  "$createdAt",
              },
              month: {
                $month:
                  "$createdAt",
              },
            },

            reviews: {
              $sum: 1,
            },

            averageRating: {
              $avg:
                "$rating",
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]);

    return {

      statistics,

      ratingDistribution,

      monthlyReviews,

    };

};

// ==========================================
// Top Rated Turfs (Admin)
// ==========================================

const getTopRatedTurfs = async (
  limit = 10
) => {

  return await Review.aggregate([
    {
      $match: {
        isDeleted: false,
        isVisible: true,
      },
    },
    {
      $group: {
        _id: "$turf",

        averageRating: {
          $avg: "$rating",
        },

        totalReviews: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        averageRating: -1,
        totalReviews: -1,
      },
    },
    {
      $limit: Number(limit),
    },
    {
      $lookup: {
        from: "turfs",
        localField: "_id",
        foreignField: "_id",
        as: "turf",
      },
    },
    {
      $unwind: "$turf",
    },
  ]);

};

// ==========================================
// Most Active Reviewers (Admin)
// ==========================================

const getMostActiveReviewers =
  async (limit = 10) => {

    return await Review.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$user",

          totalReviews: {
            $sum: 1,
          },

          averageRatingGiven: {
            $avg: "$rating",
          },
        },
      },
      {
        $sort: {
          totalReviews: -1,
        },
      },
      {
        $limit: Number(limit),
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
    ]);

};

// ==========================================
// System Review Analytics (Admin)
// ==========================================

const getSystemReviewAnalytics =
  async () => {

    const analytics =
      await Review.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,

            totalReviews: {
              $sum: 1,
            },

            averageRating: {
              $avg: "$rating",
            },

            totalHelpfulVotes: {
              $sum: "$helpfulCount",
            },

            hiddenReviews: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$isVisible",
                      false,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            reportedReviews: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      {
                        $size:
                          "$reports",
                      },
                      0,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

    return (
      analytics[0] || {
        totalReviews: 0,
        averageRating: 0,
        totalHelpfulVotes: 0,
        hiddenReviews: 0,
        reportedReviews: 0,
      }
    );

};

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

  // Owner
  replyToReview,
  updateOwnerReply,
  deleteOwnerReply,

  markHelpful,
  reportReview,

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