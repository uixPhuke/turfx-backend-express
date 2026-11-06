// src/modules/booking/booking.controller.js

const bookingService = require("./booking.service");

const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../middlewares/async.middleware");

// ==========================================
// Create Booking
// ==========================================

const createBooking = asyncHandler(async (req, res) => {

  const booking =
    await bookingService.createBooking(
      req.user._id,
      req.body
    );

  return res.status(201).json(
    new ApiResponse(
      201,
      booking,
      "Booking created successfully"
    )
  );

});

// ==========================================
// Verify Payment
// ==========================================

const verifyPayment = asyncHandler(async (req, res) => {

  const booking =
    await bookingService.verifyPayment(
      req.body, req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      booking,
      "Payment verified successfully"
    )
  );

});

// ==========================================
// Cancel Booking
// ==========================================

const cancelBooking = asyncHandler(async (req, res) => {

  const booking =
    await bookingService.cancelBooking(
      req.user._id,
      req.params.id,
      req.body.reason
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      booking,
      "Booking cancelled successfully"
    )
  );

});
// ==========================================
// Get Booking By ID
// ==========================================

const getBookingById = asyncHandler(async (req, res) => {

  const booking =
    await bookingService.getBookingById(
      req.params.id,
      req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      booking,
      "Booking fetched successfully"
    )
  );

});

// ==========================================
// Get My Bookings
// ==========================================

const getMyBookings = asyncHandler(async (req, res) => {

  const bookings =
    await bookingService.getMyBookings(
      req.user._id,
      req.query
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      bookings,
      "Bookings fetched successfully"
    )
  );

});

// ==========================================
// Get Upcoming Bookings
// ==========================================

const getUpcomingBookings = asyncHandler(async (req, res) => {

  const bookings =
    await bookingService.getUpcomingBookings(
      req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      bookings,
      "Upcoming bookings fetched successfully"
    )
  );

});

// ==========================================
// Get Completed Bookings
// ==========================================

const getCompletedBookings = asyncHandler(async (req, res) => {

  const bookings =
    await bookingService.getCompletedBookings(
      req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      bookings,
      "Completed bookings fetched successfully"
    )
  );

});
// ==========================================
// Get Owner Bookings
// ==========================================

const getOwnerBookings = asyncHandler(async (req, res) => {

  const bookings =
    await bookingService.getOwnerBookings(
      req.user._id,
      req.query
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      bookings,
      "Owner bookings fetched successfully"
    )
  );

});

// ==========================================
// Get Turf Bookings
// ==========================================

const getTurfBookings = asyncHandler(async (req, res) => {

  const bookings =
    await bookingService.getTurfBookings(
      req.params.turfId,
      req.query, req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      bookings,
      "Turf bookings fetched successfully"
    )
  );

});

// ==========================================
// Get Today's Bookings
// ==========================================

const getTodayBookings = asyncHandler(async (req, res) => {

  const bookings =
    await bookingService.getTodayBookings(
      req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      bookings,
      "Today's bookings fetched successfully"
    )
  );

});

// ==========================================
// Get Booking Calendar
// ==========================================

const getBookingCalendar = asyncHandler(async (req, res) => {

  const { month, year } = req.query;

  const calendar =
    await bookingService.getBookingCalendar(
      req.user._id,
      Number(month),
      Number(year)
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      calendar,
      "Booking calendar fetched successfully"
    )
  );

});

// ==========================================
// Owner Dashboard
// ==========================================

const getOwnerDashboard = asyncHandler(async (req, res) => {

  const dashboard =
    await bookingService.getOwnerDashboard(
      req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      dashboard,
      "Dashboard fetched successfully"
    )
  );

});

// ==========================================
// Complete Booking
// ==========================================

const completeBooking = asyncHandler(async (req, res) => {

  const booking =
    await bookingService.completeBooking(
      req.params.id, req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      booking,
      "Booking completed successfully"
    )
  );

});

// ==========================================
// Delete Booking
// ==========================================

const deleteBooking = asyncHandler(async (req, res) => {

  const response =
    await bookingService.deleteBooking(
      req.params.id,
      req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      response,
      "Booking deleted successfully"
    )
  );

});

// ==========================================
// Module Exports
// ==========================================

module.exports = {
  createBooking,
  verifyPayment,
  cancelBooking,

  getBookingById,
  getMyBookings,
  getUpcomingBookings,
  getCompletedBookings,

  getOwnerBookings,
  getTurfBookings,
  getTodayBookings,
  getBookingCalendar,
  getOwnerDashboard,

  completeBooking,
  deleteBooking,
};