const express = require("express");

const router = express.Router();

// ==========================================
// Route Imports
// ==========================================

const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/user/user.routes");
const turfRoutes = require("../modules/turf/turf.routes");
const slotRoutes = require("../modules/slot/slot.routes");
const bookingRoutes = require("../modules/booking/booking.routes");
const paymentRoutes = require("../modules/payment/payment.routes");
const walletRoutes = require("../modules/wallet/wallet.routes");
const couponRoutes = require("../modules/coupon/coupon.routes");
const reviewRoutes = require("../modules/review/review.routes");
const notificationRoutes = require("../modules/notification/notification.routes");
const adminRoutes = require("../modules/admin/admin.routes");

// ==========================================
// API Version
// ==========================================

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TurfX API v1",
    version: "1.0.0",
    timestamp: new Date(),
  });
});

// ==========================================
// Routes
// ==========================================

router.use("/auth", authRoutes);

router.use("/users", userRoutes);

router.use("/turfs", turfRoutes);

router.use("/slots", slotRoutes);

router.use("/bookings", bookingRoutes);

router.use("/payments", paymentRoutes);

router.use("/wallet", walletRoutes);

router.use("/coupons", couponRoutes);

router.use("/reviews", reviewRoutes);

router.use("/notifications", notificationRoutes);

router.use("/admin", adminRoutes);

// ==========================================
// API Health
// ==========================================

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
  });
});

module.exports = router;