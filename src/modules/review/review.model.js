const mongoose = require("mongoose");

// ==========================================
// Review Image Schema
// ==========================================

const imageSchema = new mongoose.Schema(
  {
    public_id: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// Owner Reply Schema
// ==========================================

const ownerReplySchema = new mongoose.Schema(
  {
    message: {
      type: String,
      trim: true,
      maxlength: 1000,
      required: true,
    },

    repliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// Review Schema
// ==========================================

const reviewSchema = new mongoose.Schema(
  {
    // ======================================
    // User
    // ======================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ======================================
    // Booking
    // ======================================

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },

    // ======================================
    // Turf
    // ======================================

    turf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turf",
      required: true,
      index: true,
    },

    // ======================================
    // Owner
    // ======================================

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
        // ======================================
    // Rating
    // ======================================

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },

    // ======================================
    // Review Title
    // ======================================

    title: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    // ======================================
    // Review Comment
    // ======================================

    comment: {
      type: String,
      trim: true,
      required: true,
      maxlength: 2000,
    },

    // ======================================
    // Review Images
    // ======================================

    images: {
      type: [imageSchema],
      default: [],
    },

    // ======================================
    // Owner Reply
    // ======================================

    ownerReply: {
      type: ownerReplySchema,
      default: null,
    },

    // ======================================
    // Helpful Count
    // ======================================

    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // Users Who Marked Helpful
    // ======================================

    helpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ======================================
    // Reports
    // ======================================

    reports: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        reason: {
          type: String,
          enum: [
            "spam",
            "abuse",
            "fake",
            "offensive",
            "other",
          ],
        },

        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ======================================
    // Visibility
    // ======================================

    isVisible: {
      type: Boolean,
      default: true,
    },

    // ======================================
    // Soft Delete
    // ======================================

    isDeleted: {
      type: Boolean,
      default: false,
    },
      },
  {
    timestamps: true,
    versionKey: false,
  }
);


// ==========================================
// Virtuals
// ==========================================

reviewSchema.virtual("hasImages").get(function () {
  return this.images.length > 0;
});

reviewSchema.virtual("isReplied").get(function () {
  return !!this.ownerReply;
});

// ==========================================
// Static Method
// Update Turf Rating
// ==========================================

reviewSchema.statics.updateTurfRating =
  async function (turfId) {

    const stats = await this.aggregate([
      {
        $match: {
          turf: new mongoose.Types.ObjectId(
            turfId
          ),
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
    ]);

    const Turf = mongoose.model("Turf");

    if (stats.length > 0) {

      await Turf.findByIdAndUpdate(
        turfId,
        {
          averageRating:
            Number(
              stats[0].averageRating.toFixed(1)
            ),

          totalReviews:
            stats[0].totalReviews,
        }
      );

    } else {

      await Turf.findByIdAndUpdate(
        turfId,
        {
          averageRating: 0,
          totalReviews: 0,
        }
      );

    }

  };

// ==========================================
// Middleware
// ==========================================

// After Save

reviewSchema.post(
  "save",
  async function () {

    await this.constructor.updateTurfRating(
      this.turf
    );

  }
);

// After Delete

reviewSchema.post(
  "findOneAndDelete",
  async function (doc) {

    if (doc) {

      await doc.constructor.updateTurfRating(
        doc.turf
      );

    }

  }
);

// ==========================================
// JSON Options
// ==========================================

reviewSchema.set("toJSON", {
  virtuals: true,
});

reviewSchema.set("toObject", {
  virtuals: true,
});

// ==========================================
// Export
// ==========================================

module.exports = mongoose.model(
  "Review",
  reviewSchema
);