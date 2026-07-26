const mongoose = require("mongoose");

// ==========================================
// Image Schema
// ==========================================

const imageSchema = new mongoose.Schema(
  {
    public_id: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// Pricing Schema
// ==========================================

const pricingSchema = new mongoose.Schema(
  {
    weekday: {
      type: Number,
      required: true,
      min: 0,
    },

    weekend: {
      type: Number,
      required: true,
      min: 0,
    },

    holiday: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// Working Hours Schema
// ==========================================

const workingHoursSchema = new mongoose.Schema(
  {
    is24Hours: {
      type: Boolean,
      default: true,
    },

    open: {
      type: String,
      default: "00:00",
    },

    close: {
      type: String,
      default: "23:59",
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// Contact Schema
// ==========================================

const contactSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// Address Schema
// ==========================================

const addressSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    area: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    fullAddress: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// Facilities Schema
// ==========================================

const facilitiesSchema = new mongoose.Schema(
  {
    parking: {
      type: Boolean,
      default: false,
    },

    washroom: {
      type: Boolean,
      default: false,
    },

    changingRoom: {
      type: Boolean,
      default: false,
    },

    drinkingWater: {
      type: Boolean,
      default: false,
    },

    floodLights: {
      type: Boolean,
      default: false,
    },

    cafeteria: {
      type: Boolean,
      default: false,
    },

    wifi: {
      type: Boolean,
      default: false,
    },

    locker: {
      type: Boolean,
      default: false,
    },

    firstAid: {
      type: Boolean,
      default: false,
    },

    seating: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);
// ==========================================
// Turf Schema
// ==========================================

const turfSchema = new mongoose.Schema(
  {
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
    // Basic Information
    // ======================================

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    // ======================================
    // Images
    // ======================================

    images: {
      type: [imageSchema],
      validate: {
        validator: (images) => images.length > 0,
        message: "At least one image is required",
      },
    },

    // ======================================
    // Sports
    // ======================================

    sports: {
      type: [
        {
          type: String,
          enum: [
            "football",
            "cricket",
            "badminton",
            "basketball",
            "volleyball",
            "tennis",
          ],
        },
      ],
      required: true,
    },

    // ======================================
    // Pricing
    // ======================================

    pricing: pricingSchema,

    // ======================================
    // Working Hours
    // ======================================

    workingHours: workingHoursSchema,

    // ======================================
    // Slot Duration
    // ======================================

    slotDuration: {
      type: Number,
      enum: [30, 60, 90, 120],
      default: 60,
    },

    // ======================================
    // Capacity
    // ======================================

    maxPlayers: {
      type: Number,
      default: 10,
      min: 2,
    },

    // ======================================
    // Contact
    // ======================================

    contact: contactSchema,

    // ======================================
    // Facilities
    // ======================================

    facilities: facilitiesSchema,

    // ======================================
    // Address
    // ======================================

    address: addressSchema,

    // ======================================
    // GeoJSON Location
    // ======================================

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number],
        required: true,
      },
    },

    // ======================================
    // Ratings
    // ======================================

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    // ======================================
    // Statistics
    // ======================================

    totalBookings: {
      type: Number,
      default: 0,
    },

    totalRevenue: {
      type: Number,
      default: 0,
    },

    totalViews: {
      type: Number,
      default: 0,
    },

    // ======================================
    // Status
    // ======================================

    isVerified: {
      type: Boolean,
      default: false,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

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

// Reviews
turfSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "turf",
});

// Bookings
turfSchema.virtual("bookings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "turf",
});

// Slots
turfSchema.virtual("slots", {
  ref: "Slot",
  localField: "_id",
  foreignField: "turf",
});

// ==========================================
// JSON Settings
// ==========================================

turfSchema.set("toJSON", {
  virtuals: true,
});

turfSchema.set("toObject", {
  virtuals: true,
});

// ==========================================
// Query Middleware
// ==========================================

// Hide deleted turfs automatically
turfSchema.pre(/^find/, function (next) {
  this.find({
    isDeleted: false,
  });

  next();
});

// ==========================================
// Instance Method
// ==========================================

turfSchema.methods.incrementViews = async function () {
  this.totalViews += 1;
  await this.save();
};

// ==========================================
// Static Method
// ==========================================

turfSchema.statics.findApproved = function () {
  return this.find({
    isApproved: true,
    isActive: true,
    isDeleted: false,
  });
};

// ==========================================
// Export
// ==========================================

module.exports = mongoose.model(
  "Turf",
  turfSchema
);