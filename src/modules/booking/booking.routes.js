// src/modules/booking/booking.routes.js

const express = require("express");

const router = express.Router();

const bookingController = require("./booking.controller");

const {
  createBookingValidation,
  cancelBookingValidation,
  verifyPaymentValidation,
  bookingIdValidation,
  searchBookingsValidation,
  dateFilterValidation,
  paginationValidation,
} = require("./booking.validation");

const auth = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validation.middleware");

const {
  bookingLimiter,
  paymentLimiter,
} = require("../../middlewares/rateLimiter");

// ==========================================
// User Routes
// ==========================================

// Create Booking
router.post(
  "/",
  auth,
  authorize("user"),
  bookingLimiter,
  createBookingValidation,
  validate,
  bookingController.createBooking
);

// Verify Payment
router.post(
  "/verify-payment",
  auth,
  authorize("user"),
  paymentLimiter,
  verifyPaymentValidation,
  validate,
  bookingController.verifyPayment
);

// My Bookings
router.get(
  "/my-bookings",
  auth,
  authorize("user"),
  searchBookingsValidation,
  paginationValidation,
  validate,
  bookingController.getMyBookings
);

// Upcoming Bookings
router.get(
  "/my-bookings/upcoming",
  auth,
  authorize("user"),
  bookingController.getUpcomingBookings
);

// Completed Bookings
router.get(
  "/my-bookings/completed",
  auth,
  authorize("user"),
  bookingController.getCompletedBookings
);

// Booking Details
router.get(
  "/:id",
  auth,
  bookingIdValidation,
  validate,
  bookingController.getBookingById
);

// Cancel Booking
router.patch(
  "/:id/cancel",
  auth,
  authorize("user"),
  bookingLimiter,
  bookingIdValidation,
  cancelBookingValidation,
  validate,
  bookingController.cancelBooking
);

// Delete Booking
router.delete(
  "/:id",
  auth,
  authorize("user"),
  bookingLimiter,
  bookingIdValidation,
  validate,
  bookingController.deleteBooking
);

// ==========================================
// Owner Routes
// ==========================================

// All Owner Bookings
router.get(
  "/owner/all",
  auth,
  authorize("owner"),
  searchBookingsValidation,
  paginationValidation,
  dateFilterValidation,
  validate,
  bookingController.getOwnerBookings
);

// Turf Bookings
router.get(
  "/owner/turf/:turfId",
  auth,
  authorize("owner"),
  paginationValidation,
  validate,
  bookingController.getTurfBookings
);

// Today's Bookings
router.get(
  "/owner/today",
  auth,
  authorize("owner"),
  bookingController.getTodayBookings
);

// Booking Calendar
router.get(
  "/owner/calendar",
  auth,
  authorize("owner"),
  bookingController.getBookingCalendar
);

// Owner Dashboard
router.get(
  "/owner/dashboard",
  auth,
 authorize("owner"),
  bookingController.getOwnerDashboard
);

// Complete Booking
router.patch(
  "/:id/complete",
  auth,
  authorize("owner"),
  bookingLimiter,
  bookingIdValidation,
  validate,
  bookingController.completeBooking
);

module.exports = router;