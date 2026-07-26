const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    otp: {
      type: String,
      required: true,
      select: false,
    },

    purpose: {
      type: String,
      enum: [
        "EMAIL_VERIFICATION",
        "FORGOT_PASSWORD",
      ],
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Automatically delete expired OTP documents
 */
otpSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);

/**
 * One active OTP per user & purpose
 */
otpSchema.index(
  {
    user: 1,
    purpose: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Otp", otpSchema);
