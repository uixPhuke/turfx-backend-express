const mongoose = require("mongoose");

// ==========================================
// Slot Schema
// ==========================================

const slotSchema = new mongoose.Schema(
  {
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
    // Booking
    // ======================================

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    // ======================================
    // Date
    // ======================================

    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },

    // ======================================
    // Time
    // ======================================

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    // ======================================
    // Price
    // ======================================

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // ======================================
    // Status
    // ======================================

    status: {
      type: String,
      enum: [
        "available",
        "booked",
        "blocked",
        "maintenance",
      ],
      default: "available",
      index: true,
    },

    // ======================================
    // Block / Maintenance Reason
    // ======================================

    reason: {
      type: String,
      default: "",
      trim: true,
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



// ==========================================
// Virtual
// ==========================================

slotSchema.virtual("isBooked").get(function () {
  return this.status === "booked";
});

// ==========================================
// JSON Settings
// ==========================================

slotSchema.set("toJSON", {
  virtuals: true,
});

slotSchema.set("toObject", {
  virtuals: true,
});

// ==========================================
// Export
// ==========================================

module.exports = mongoose.model(
  "Slot",
  slotSchema
);