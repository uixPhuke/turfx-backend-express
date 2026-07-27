

const mongoose = require("mongoose");

const authSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    otp: {
      type: String,
      default: null,
    },

    otpType: {
      type: String,
      enum: [
        "email_verification",
        "forgot_password",
        "phone_verification",
      ],
      default: "email_verification",
    },

    otpExpiresAt: {
      type: Date,
      default: null,
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    lastLoginIP: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Automatically expire OTP records after expiry time
authSchema.index(
  { otpExpiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: {
      otpExpiresAt: { $exists: true },
    },
  }
);

module.exports = mongoose.model("Auth", authSchema);