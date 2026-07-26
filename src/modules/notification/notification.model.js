const mongoose = require("mongoose");

// ==========================================
// Attachment Schema
// ==========================================

const attachmentSchema = new mongoose.Schema(
  {
    public_id: {
      type: String,
      default: null,
    },

    url: {
      type: String,
      default: null,
    },

    fileName: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// Notification Schema
// ==========================================

const notificationSchema = new mongoose.Schema(
  {
    // ======================================
    // Receiver
    // ======================================

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ======================================
    // Sender
    // ======================================

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ======================================
    // Title
    // ======================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    // ======================================
    // Message
    // ======================================

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // ======================================
    // Attachments
    // ======================================

    attachments: {
      type: [attachmentSchema],
      default: [],
    },
        // ======================================
    // Notification Type
    // ======================================

    type: {
      type: String,
      enum: [
        "booking_created",
        "booking_confirmed",
        "booking_cancelled",
        "booking_reminder",

        "payment_success",
        "payment_failed",
        "refund_processed",

        "review_received",
        "review_reply",

        "coupon",

        "owner_approved",
        "owner_rejected",

        "turf_approved",
        "turf_rejected",

        "system",
      ],
      required: true,
      index: true,
    },

    // ======================================
    // Reference
    // ======================================

    referenceType: {
      type: String,
      enum: [
        "Booking",
        "Payment",
        "Review",
        "Coupon",
        "Turf",
        "User",
        "System",
      ],
      default: "System",
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // ======================================
    // Extra Payload
    // ======================================

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ======================================
    // Delivery Channels
    // ======================================

    channels: {

      inApp: {
        type: Boolean,
        default: true,
      },

      push: {
        type: Boolean,
        default: false,
      },

      email: {
        type: Boolean,
        default: false,
      },

      sms: {
        type: Boolean,
        default: false,
      },

    },

    // ======================================
    // Delivery Status
    // ======================================

    deliveryStatus: {

      inApp: {
        type: Boolean,
        default: true,
      },

      push: {
        type: Boolean,
        default: false,
      },

      email: {
        type: Boolean,
        default: false,
      },

      sms: {
        type: Boolean,
        default: false,
      },

    },

    // ======================================
    // Read Status
    // ======================================

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // ======================================
    // Priority
    // ======================================

    priority: {
      type: String,
      enum: [
        "low",
        "normal",
        "high",
        "urgent",
      ],
      default: "normal",
      index: true,
    },
      },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ==========================================
// Expiration
// ==========================================

notificationSchema.add({

  expiresAt: {
    type: Date,
    default: null,
    index: true,
  },

});

// ==========================================
// Soft Delete
// ==========================================

notificationSchema.add({

  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

});


// ==========================================
// Virtuals
// ==========================================

notificationSchema.virtual("isUnread").get(
  function () {
    return !this.isRead;
  }
);

notificationSchema.virtual("hasAttachments").get(
  function () {
    return this.attachments.length > 0;
  }
);

// ==========================================
// Instance Methods
// ==========================================

notificationSchema.methods.markAsRead =
  async function () {

    if (!this.isRead) {

      this.isRead = true;

      this.readAt = new Date();

      await this.save();

    }

    return this;

  };

// ==========================================
// Static Methods
// ==========================================

notificationSchema.statics.markAllAsRead =
  async function (receiverId) {

    return this.updateMany(
      {
        receiver: receiverId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

  };

// Delete Expired Notifications

notificationSchema.statics.deleteExpired =
  async function () {

    return this.deleteMany({
      expiresAt: {
        $ne: null,
        $lte: new Date(),
      },
    });

  };

// ==========================================
// JSON Options
// ==========================================

notificationSchema.set("toJSON", {
  virtuals: true,
});

notificationSchema.set("toObject", {
  virtuals: true,
});

// ==========================================
// Export
// ==========================================

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);