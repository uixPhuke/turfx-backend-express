const mongoose = require("mongoose");

// ==========================================
// Payment Schema
// ==========================================

const paymentSchema = new mongoose.Schema(
  {
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
    // Booking Number
    // ======================================

    bookingNumber: {
      type: String,
      required: true,
      index: true,
    },

    // ======================================
    // Amount Details
    // ======================================

    amount: {
      subtotal: {
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

      total: {
        type: Number,
        required: true,
      },

      currency: {
        type: String,
        default: "INR",
      },
    },

    // ======================================
    // Payment Method
    // ======================================

    paymentMethod: {
      type: String,
      enum: [
        "razorpay",
        "upi",
        "card",
        "netbanking",
        "wallet",
      ],
      default: "razorpay",
    },

    // ======================================
    // Razorpay Details
    // ======================================

    razorpay: {
      orderId: {
        type: String,
        default: null,
        index: true,
      },

      paymentId: {
        type: String,
        default: null,
        index: true,
      },

      signature: {
        type: String,
        default: null,
      },
    },
        // ======================================
    // Payment Status
    // ======================================

    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "authorized",
        "captured",
        "paid",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      default: "created",
      index: true,
    },

    // ======================================
    // Refund Details
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

      reason: {
        type: String,
        default: "",
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

      refundedAt: {
        type: Date,
        default: null,
      },
    },

    // ======================================
    // Webhook Details
    // ======================================

    webhook: {
      eventId: {
        type: String,
        default: null,
      },

      event: {
        type: String,
        default: null,
      },

      payload: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      receivedAt: {
        type: Date,
        default: null,
      },
    },

    // ======================================
    // Failure Information
    // ======================================

    failure: {
      code: {
        type: String,
        default: null,
      },

      reason: {
        type: String,
        default: null,
      },

      source: {
        type: String,
        default: null,
      },

      step: {
        type: String,
        default: null,
      },

      description: {
        type: String,
        default: null,
      },
    },

    // ======================================
    // Settlement Details
    // ======================================

    settlement: {
      settlementId: {
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
          "pending",
          "processing",
          "completed",
        ],
        default: "pending",
      },

      settledAt: {
        type: Date,
        default: null,
      },
    },

    // ======================================
    // Payment Timeline
    // ======================================

    paidAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
        // ======================================
    // Metadata
    // ======================================

    metadata: {
      gateway: {
        type: String,
        default: "razorpay",
      },

      ipAddress: {
        type: String,
        default: null,
      },

      device: {
        type: String,
        default: null,
      },

      platform: {
        type: String,
        default: null,
      },
    },

    // ======================================
    // Notes
    // ======================================

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    // ======================================
    // Active
    // ======================================

    isActive: {
      type: Boolean,
      default: true,
    },

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

paymentSchema.virtual("isPaid").get(function () {
  return (
    this.status === "paid" ||
    this.status === "captured"
  );
});

paymentSchema.virtual("isRefunded").get(function () {
  return (
    this.status === "refunded" ||
    this.status ===
      "partially_refunded"
  );
});

paymentSchema.virtual("isFailed").get(function () {
  return this.status === "failed";
});

// ==========================================
// Pre Save Hook
// ==========================================

// ==========================================
// Pre Save Hook
// ==========================================

paymentSchema.pre("save", function () {
  if (this.amount) {
    this.amount.total =
      this.amount.subtotal +
      this.amount.convenienceFee +
      this.amount.tax -
      this.amount.discount;
  }
});

// ==========================================
// JSON Settings
// ==========================================

paymentSchema.set("toJSON", {
  virtuals: true,
});

paymentSchema.set("toObject", {
  virtuals: true,
});

// ==========================================
// Export
// ==========================================

module.exports = mongoose.model(
  "Payment",
  paymentSchema
);