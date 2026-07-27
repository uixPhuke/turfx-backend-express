const mongoose = require("mongoose");

// ==========================================
// User Usage Schema
// ==========================================

const userUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// Coupon Schema
// ==========================================

const couponSchema = new mongoose.Schema(
  {
    // ======================================
    // Coupon Code
    // ======================================

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },

    // ======================================
    // Title
    // ======================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // ======================================
    // Description
    // ======================================

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // ======================================
    // Coupon Type
    // ======================================

    type: {
      type: String,
      enum: [
        "percentage",
        "flat",
        "free_booking",
        "first_booking",
        "cashback",
      ],
      required: true,
      index: true,
    },

    // ======================================
    // Discount Value
    // ======================================

    value: {
      type: Number,
      required: true,
      min: 0,
    },

    // ======================================
    // User Usage
    // ======================================

    userUsage: {
      type: [userUsageSchema],
      default: [],
    },
        // ======================================
    // Minimum Booking Amount
    // ======================================

    minimumBookingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // Maximum Discount
    // ======================================

    maximumDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // Usage Limit
    // ======================================

    usageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    usagePerUser: {
      type: Number,
      default: 1,
      min: 1,
    },

    // ======================================
    // Validity
    // ======================================

    validFrom: {
      type: Date,
      required: true,
      index: true,
    },

    validUntil: {
      type: Date,
      required: true,
      index: true,
    },

    // ======================================
    // Applicable Turfs
    // ======================================

    applicableTurfs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Turf",
      },
    ],

    // ======================================
    // Owner
    // ======================================

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ======================================
    // Global Coupon
    // ======================================

    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ======================================
    // Active Status
    // ======================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ======================================
    // First Booking Only
    // ======================================

    firstBookingOnly: {
      type: Boolean,
      default: false,
    },

    // ======================================
    // Soft Delete
    // ======================================

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
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

couponSchema.virtual("isExpired").get(
  function () {

    return (
      new Date() >
      this.validUntil
    );

  }
);

couponSchema.virtual("remainingUses").get(
  function () {

    if (this.usageLimit === 0) {

      return Infinity;

    }

    return Math.max(
      0,
      this.usageLimit -
        this.usedCount
    );

  }
);

// ==========================================
// Static Methods
// ==========================================

// Validate Coupon

couponSchema.statics.validateCoupon =
  async function (
    code,
    bookingAmount
  ) {

    const coupon =
      await this.findOne({

        code:
          code.toUpperCase(),

        isDeleted: false,

        isActive: true,

      });

    if (!coupon) {

      throw new Error(
        "Coupon not found"
      );

    }

    const now =
      new Date();

    if (
      now < coupon.validFrom
    ) {

      throw new Error(
        "Coupon is not active yet"
      );

    }

    if (
      now >
      coupon.validUntil
    ) {

      throw new Error(
        "Coupon has expired"
      );

    }

    if (
      coupon.usageLimit > 0 &&
      coupon.usedCount >=
        coupon.usageLimit
    ) {

      throw new Error(
        "Coupon usage limit exceeded"
      );

    }

    if (
      bookingAmount <
      coupon.minimumBookingAmount
    ) {

      throw new Error(
        "Minimum booking amount not met"
      );

    }

    return coupon;

  };

// Increment Usage

couponSchema.statics.incrementUsage =
  async function (
    couponId,
    userId
  ) {

    const coupon =
      await this.findById(
        couponId
      );

    if (!coupon) {

      return null;

    }

    coupon.usedCount++;

    const userUsage =
      coupon.userUsage.find(
        (item) =>
          item.user.toString() ===
          userId.toString()
      );

    if (userUsage) {

      userUsage.usedCount++;

      userUsage.lastUsedAt =
        new Date();

    } else {

      coupon.userUsage.push({

        user: userId,

        usedCount: 1,

        lastUsedAt:
          new Date(),

      });

    }

    await coupon.save();

    return coupon;

  };

// ==========================================
// Middleware
// ==========================================
couponSchema.pre("save", function () {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
});

// ==========================================
// JSON Options
// ==========================================

couponSchema.set(
  "toJSON",
  {
    virtuals: true,
  }
);

couponSchema.set(
  "toObject",
  {
    virtuals: true,
  }
);

// ==========================================
// Export
// ==========================================

module.exports =
  mongoose.model(
    "Coupon",
    couponSchema
  );