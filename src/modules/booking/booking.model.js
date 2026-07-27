const mongoose = require("mongoose");

// ==========================================
// Booking Schema
// ==========================================

const bookingSchema = new mongoose.Schema(
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
    // Owner
    // ======================================

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    // Slot
    // ======================================

    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
      unique: true,
    },
// ======================================
// Booking Number
// ======================================

bookingNumber: {
  type: String,
  required: true,
  unique: true,
  index: true,
},
    // ======================================
    // Booking Information
    // ======================================

    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
      default: 60, // minutes
    },

    // ======================================
    // Player Details
    // ======================================

    players: {
      type: Number,
      required: true,
      min: 1,
    },

    sport: {
      type: String,
      required: true,
      enum: [
        "football",
        "cricket",
        "badminton",
        "basketball",
        "volleyball",
        "tennis",
      ],
    },

    // ======================================
    // Pricing Snapshot
    // ======================================

    pricing: {
      slotPrice: {
        type: Number,
        required: true,
      },

      convenienceFee: {
        type: Number,
        default: 0,
      },

      tax: {
        type: Number,
        default: 0,
      },

      discount: {
        type: Number,
        default: 0,
      },

      totalAmount: {
        type: Number,
        required: true,
      },
    },
        // ======================================
    // Payment Information
    // ======================================

    payment: {
      paymentId: {
        type: String,
        default: null,
      },

      orderId: {
        type: String,
        default: null,
      },

      signature: {
        type: String,
        default: null,
      },

      method: {
        type: String,
        enum: [
          "razorpay",
          "upi",
          "card",
          "netbanking",
          "wallet",
          "cash",
        ],
        default: "razorpay",
      },

      status: {
        type: String,
        enum: [
          "pending",
          "paid",
          "failed",
          "refunded",
        ],
        default: "pending",
        index: true,
      },

      paidAt: Date,
    },

    // ======================================
    // Coupon
    // ======================================

    coupon: {
      code: {
        type: String,
        default: null,
      },

      discountAmount: {
        type: Number,
        default: 0,
      },
    },

    // ======================================
    // Booking Status
    // ======================================

    bookingStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "expired",
      ],
      default: "pending",
      index: true,
    },

    // ======================================
    // Cancellation
    // ======================================

    cancellation: {
      cancelledBy: {
        type: String,
        enum: [
          "user",
          "owner",
          "admin",
        ],
        default: null,
      },

      reason: {
        type: String,
        default: "",
      },

      cancelledAt: Date,
    },

    // ======================================
    // Refund
    // ======================================

    refund: {
      refundId: {
        type: String,
        default: null,
      },

      amount: {
        type: Number,
        default: 0,
      },

      status: {
        type: String,
        enum: [
          "none",
          "pending",
          "processed",
          "failed",
        ],
        default: "none",
      },

      refundedAt: Date,
    },

    // ======================================
    // Invoice
    // ======================================

    invoice: {
      invoiceNumber: {
        type: String,
        default: null,
      },

      invoiceUrl: {
        type: String,
        default: null,
      },
    },
        // ======================================
    // Review
    // ======================================

    isReviewed: {
      type: Boolean,
      default: false,
    },

    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      default: null,
    },

    // ======================================
    // Notes
    // ======================================

    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    // ======================================
    // Active
    // ======================================

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


// Booking Status



// ==========================================
// Virtuals
// ==========================================
// ==========================================
// Generate Booking Number
// ==========================================

bookingSchema.pre("validate", async function () {
  if (!this.bookingNumber) {
    const count = await mongoose.model("Booking").countDocuments();
    this.bookingNumber = `BK-${String(count + 1).padStart(6, "0")}`;
  }
});
bookingSchema.virtual("isUpcoming").get(function () {
  return (
    this.bookingStatus === "confirmed" &&
    this.bookingDate >= new Date()
  );
});

bookingSchema.virtual("isCompleted").get(function () {
  return this.bookingStatus === "completed";
});

bookingSchema.virtual("isCancelled").get(function () {
  return this.bookingStatus === "cancelled";
});

// ==========================================
// Pre Save Hook
// ==========================================
bookingSchema.pre("save", function () {
  if (this.pricing) {
    this.pricing.totalAmount =
      this.pricing.slotPrice +
      this.pricing.convenienceFee +
      this.pricing.tax -
      this.pricing.discount;
  }
});

// ==========================================
// JSON Options
// ==========================================

bookingSchema.set("toJSON", {
  virtuals: true,
});

bookingSchema.set("toObject", {
  virtuals: true,
});

// ==========================================
// Export
// ==========================================

module.exports = mongoose.model(
  "Booking",
  bookingSchema
);