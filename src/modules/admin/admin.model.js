// src/modules/admin/admin.model.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ==========================================
// Permission Schema
// ==========================================

const permissionSchema = new mongoose.Schema(
  {
    create: {
      type: Boolean,
      default: false,
    },

    read: {
      type: Boolean,
      default: true,
    },

    update: {
      type: Boolean,
      default: false,
    },

    delete: {
      type: Boolean,
      default: false,
    },

    manage: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// Admin Profile Schema
// ==========================================

const profileSchema = new mongoose.Schema(
  {
    avatar: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    designation: {
      type: String,
      trim: true,
      default: "",
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// Admin Schema
// ==========================================

const adminSchema = new mongoose.Schema(
  {

    // ======================================
    // Basic Information
    // ======================================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: [
        "super_admin",
        "admin",
        "support",
        "finance",
        "moderator",
        "operations",
      ],
      default: "admin",
      index: true,
    },

    profile: {
      type: profileSchema,
      default: () => ({}),
    },

    // ======================================
    // Authentication
    // ======================================

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    loginCount: {
      type: Number,
      default: 0,
      min: 0,
    },
        // ======================================
    // Permissions
    // ======================================

    permissions: {

      users: {
        type: permissionSchema,
        default: () => ({}),
      },

      owners: {
        type: permissionSchema,
        default: () => ({}),
      },

      turfs: {
        type: permissionSchema,
        default: () => ({}),
      },

      bookings: {
        type: permissionSchema,
        default: () => ({}),
      },

      payments: {
        type: permissionSchema,
        default: () => ({}),
      },

      wallets: {
        type: permissionSchema,
        default: () => ({}),
      },

      coupons: {
        type: permissionSchema,
        default: () => ({}),
      },

      reviews: {
        type: permissionSchema,
        default: () => ({}),
      },

      notifications: {
        type: permissionSchema,
        default: () => ({}),
      },

      analytics: {
        type: permissionSchema,
        default: () => ({}),
      },

      settings: {
        type: permissionSchema,
        default: () => ({}),
      },

    },

    // ======================================
    // Security
    // ======================================

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
      default: null,
      select: false,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    // ======================================
    // Login Activity
    // ======================================

    lastLoginIP: {
      type: String,
      default: "",
    },

    lastLoginDevice: {
      type: String,
      default: "",
    },

    // ======================================
    // Preferences
    // ======================================

    preferences: {

      language: {
        type: String,
        default: "en",
      },

      timezone: {
        type: String,
        default: "Asia/Kolkata",
      },

      emailNotifications: {
        type: Boolean,
        default: true,
      },

      pushNotifications: {
        type: Boolean,
        default: true,
      },

      darkMode: {
        type: Boolean,
        default: false,
      },

    },

    // ======================================
    // Account Status
    // ======================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ======================================
    // Audit Fields
    // ======================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
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

// Account Locked

adminSchema.virtual("isLocked").get(
  function () {

    return (
      !!this.lockUntil &&
      this.lockUntil > Date.now()
    );

  }
);

// Full Profile

// Full Profile

adminSchema.virtual("fullProfile").get(function () {
  const profile = this.profile || {};

  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,

    avatar: profile.avatar || "",
    designation: profile.designation || "",
    department: profile.department || "",
  };
});

// ==========================================
// Instance Methods
// ==========================================

// Compare Password

adminSchema.methods.comparePassword =
  async function (password) {

    return bcrypt.compare(
      password,
      this.password
    );

  };

// Check Permission

adminSchema.methods.hasPermission =
  function (
    module,
    action
  ) {

    if (
      this.role ===
      "super_admin"
    ) {

      return true;

    }

    return !!(
      this.permissions[module] &&
      this.permissions[module][action]
    );

  };

// Increase Failed Login Attempts

adminSchema.methods.incrementLoginAttempts =
  async function () {

    this.failedLoginAttempts += 1;

    if (
      this.failedLoginAttempts >=
      5
    ) {

      this.lockUntil =
        new Date(
          Date.now() +
          30 * 60 * 1000
        );

    }

    await this.save();

  };

// Reset Login Attempts

adminSchema.methods.resetLoginAttempts =
  async function () {

    this.failedLoginAttempts = 0;

    this.lockUntil = null;

    await this.save();

  };

// ==========================================
// Static Methods
// ==========================================

// Find Active Admin

adminSchema.statics.findActiveByEmail =
  function (email) {

    return this.findOne({

      email,

      isDeleted: false,

      isActive: true,

    }).select("+password");

  };

// ==========================================
// Middleware
// ==========================================

// Hash Password

adminSchema.pre("save", async function () {

  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(
    this.password,
    salt
  );

});

// ==========================================
// JSON Options
// ==========================================

adminSchema.set(
  "toJSON",
  {

    virtuals: true,

    transform: (
      doc,
      ret
    ) => {

      delete ret.password;

      delete ret.refreshToken;

      delete ret.twoFactorSecret;

      delete ret.__v;

      return ret;

    },

  }
);

adminSchema.set(
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
    "Admin",
    adminSchema
  );