const hpp = require("hpp");

// ==========================================
// HTTP Parameter Pollution Protection
// ==========================================

const hppMiddleware = hpp({
  whitelist: [
    // Search & Filtering
    "sort",
    "fields",
    "page",
    "limit",
    "search",

    // Turf Filters
    "sportType",
    "city",
    "state",
    "price",
    "minPrice",
    "maxPrice",
    "rating",

    // Booking Filters
    "bookingStatus",
    "paymentStatus",
    "date",
    "startDate",
    "endDate",

    // Coupon Filters
    "type",
    "isActive",
    "isGlobal",

    // Notification
    "isRead",

    // Wallet
    "transactionType",

    // Admin
    "role",
  ],
});

module.exports = hppMiddleware;