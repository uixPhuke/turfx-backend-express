const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ==============================
    // Basic Information
    // ==============================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    // ==============================
    // Profile
    // ==============================

    avatar: {
      public_id: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      },
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },

    dateOfBirth: {
      type: Date,
    },

    // ==============================
    // Address
    // ==============================

    address: {
      state: String,
      city: String,
      area: String,
      pincode: String,
    },

    // ==============================
    // Authentication
    // ==============================

    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    lastLogin: {
      type: Date,
    },

    // ==============================
    // Owner Information
    // ==============================

    ownerDetails: {
      businessName: {
        type: String,
        default: "",
      },

      gstNumber: {
        type: String,
        default: "",
      },

      panNumber: {
        type: String,
        default: "",
      },

      isApproved: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ==============================
// Indexes
// ==============================



// ==============================
// Hash Password
// ==============================

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});
// ==============================
// Compare Password
// ==============================

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// ==============================
// Hide Sensitive Fields
// ==============================

userSchema.methods.toJSON = function () {
  const user = this.toObject();

  delete user.password;
  delete user.refreshToken;

  return user;
};

module.exports = mongoose.model("User", userSchema);