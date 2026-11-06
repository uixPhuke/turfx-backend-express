const crypto = require("crypto");

const Booking = require("./booking.model");
const Turf = require("../turf/turf.model");
const User = require("../user/user.model");

const slotService = require("../slot/slot.service");

const ApiError = require("../../utils/ApiError");

// ==========================================
// Generate Booking Number
// Example: BK202607250001
// ==========================================

const generateBookingNumber = async () => {
  const today = new Date();

  const date =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const count =
    await Booking.countDocuments({
      createdAt: {
        $gte: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ),
      },
    });

  return `BK${date}${String(count + 1).padStart(4, "0")}`;
};

// ==========================================
// Calculate Pricing
// ==========================================

const calculatePricing = (
  slotPrice,
  discount = 0
) => {

  const convenienceFee = 20;

  const tax = Number(
    ((slotPrice + convenienceFee) * 0.18).toFixed(2)
  );

  const totalAmount =
    slotPrice +
    convenienceFee +
    tax -
    discount;

  return {
    slotPrice,

    convenienceFee,

    tax,

    discount,

    totalAmount,
  };

};

// ==========================================
// Create Booking
// ==========================================

const createBooking = async (
  userId,
  data
) => {

  const {
    turf: turfId,
    bookingDate,
    startTime,
    endTime,
    players,
    sport,
    couponCode,
    notes,
  } = data;

  // ========================================
  // User
  // ========================================

  const user = await User.findById(
    userId
  );

  if (!user) {
    throw new ApiError(
      404,
      "User not found"
    );
  }

  if (user.isBlocked) {
    throw new ApiError(
      403,
      "Your account has been blocked"
    );
  }

  // ========================================
  // Turf
  // ========================================

  const turf = await Turf.findById(
    turfId
  );

  if (!turf) {
    throw new ApiError(
      404,
      "Turf not found"
    );
  }

  if (!turf.isApproved) {
    throw new ApiError(
      400,
      "Turf is not approved"
    );
  }

  if (!turf.isActive) {
    throw new ApiError(
      400,
      "Turf is not active"
    );
  }

  // ========================================
  // Player Limit
  // ========================================

  if (players > turf.maxPlayers) {
    throw new ApiError(
      400,
      `Maximum ${turf.maxPlayers} players are allowed`
    );
  }

  // ========================================
  // Slot Availability
  // ========================================

  const available =
    await slotService.isSlotAvailable(
      turfId,
      bookingDate,
      startTime,
      endTime
    );

  if (!available) {
    throw new ApiError(
      409,
      "Selected slot is not available"
    );
  }

  // ========================================
  // Weekday / Weekend Price
  // ========================================

  const day = new Date(
    bookingDate
  ).getDay();

  const isWeekend =
    day === 0 || day === 6;

  const slotPrice = isWeekend
    ? turf.pricing.weekend
    : turf.pricing.weekday;
      // ========================================
  // Coupon (Placeholder)
  // ========================================

  let discount = 0;

  if (couponCode) {

    // Coupon module will be integrated later.
    // Example:
    // const coupon =
    //   await couponService.applyCoupon(
    //     couponCode,
    //     userId,
    //     slotPrice
    //   );
    //
    // discount = coupon.discountAmount;

    discount = 0;
  }

  // ========================================
  // Pricing Snapshot
  // ========================================

  const pricing = calculatePricing(
    slotPrice,
    discount
  );

  // ========================================
  // Booking Number
  // ========================================

  const bookingNumber =
    await generateBookingNumber();

  // ========================================
  // Create Booking
  // ========================================



// Create booking object (not saved)
const booking = new Booking({
  bookingNumber,

  user: user._id,
  owner: turf.owner,
  turf: turf._id,

  bookingDate: new Date(bookingDate),

  startTime,
  endTime,

  duration: turf.slotDuration,

  players,
  sport,

  pricing,

  coupon: {
    code: couponCode || null,
    discountAmount: discount,
  },

  notes,

  bookingStatus: "pending",

  payment: {
    method: "razorpay",
    status: "pending",
  },
});
const slot = await slotService.bookSlot(
  booking._id,
  turf._id,
  turf.owner,
  bookingDate,
  startTime,
  endTime,
  pricing.slotPrice
);

booking.slot = slot._id;

await booking.save();


  // ========================================
  // Razorpay Placeholder
  // ========================================

  /*
    Payment module will create:

    const razorpayOrder =
      await paymentService.createOrder(
        booking
      );

    booking.payment.orderId =
      razorpayOrder.id;

    await booking.save();
  */

  return booking;

};



// ==========================================
// Verify Razorpay Payment
// ==========================================

const verifyPayment = async (data, actorId) => {
  const result = await require("../payment/payment.service").verifyPayment(data, actorId);
  return result.booking;
};

// ==========================================
// Confirm Booking
// ==========================================

const confirmBooking = async (
  bookingId
) => {

  const booking =
    await Booking.findById(
      bookingId
    );

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found"
    );
  }

  if (
    booking.payment.status !==
    "paid"
  ) {
    throw new ApiError(
      400,
      "Payment is pending"
    );
  }

  booking.bookingStatus =
    "confirmed";

  await booking.save();

  return booking;

};
// ==========================================
// Cancel Booking
// ==========================================

const cancelBooking = async (
  userId,
  bookingId,
  reason
) => {

  const booking =
    await Booking.findById(bookingId);

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found"
    );
  }

  // ========================================
  // Authorization
  // ========================================

  if (
    booking.user.toString() !==
    userId.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to cancel this booking"
    );
  }

  if (
    booking.bookingStatus ===
    "cancelled"
  ) {
    throw new ApiError(
      400,
      "Booking is already cancelled"
    );
  }

  if (
    booking.bookingStatus ===
    "completed"
  ) {
    throw new ApiError(
      400,
      "Completed booking cannot be cancelled"
    );
  }

  // ========================================
  // Cancellation Policy
  // ========================================

  const bookingStart = new Date(
    booking.bookingDate
  );

  const [hour, minute] =
    booking.startTime
      .split(":")
      .map(Number);

  bookingStart.setHours(hour);
  bookingStart.setMinutes(minute);
  bookingStart.setSeconds(0);

  const now = new Date();

  const diff =
    bookingStart.getTime() -
    now.getTime();

  const hoursBefore =
    diff / (1000 * 60 * 60);

  let refundPercentage = 100;

  if (hoursBefore < 2) {
    refundPercentage = 0;
  } else if (hoursBefore < 12) {
    refundPercentage = 50;
  }

  const refundAmount =
    Math.round(
      booking.pricing.totalAmount *
        (refundPercentage / 100)
    );

  // ========================================
  // Update Booking
  // ========================================

  booking.bookingStatus =
    "cancelled";

  booking.cancellation = {

    cancelledBy: "user",

    reason,

    cancelledAt: new Date(),

  };

  booking.refund.amount =
    refundAmount;

  booking.refund.status =
    refundAmount > 0
      ? "pending"
      : "none";

  await booking.save();

  // ========================================
  // Release Slot
  // ========================================

  await slotService.releaseSlot(
    booking.slot
  );

  return booking;

};

// ==========================================
// Refund Booking
// ==========================================

const refundBooking = async (bookingId) => {
  const Payment = require("../payment/payment.model");
  const payment = await Payment.findOne({ booking: bookingId, isDeleted: false });
  if (!payment) throw new ApiError(404, "Payment not found");
  return require("../payment/payment.service").refundPayment(payment._id);
};
// ==========================================
// Get Booking By ID
// ==========================================

const getBookingById = async (
  bookingId,
  userId
) => {

  const booking =
    await Booking.findById(bookingId)
      .populate(
        "user",
        "name email phone avatar"
      )
      .populate(
        "owner",
        "name phone"
      )
      .populate(
        "turf",
        "name images address"
      )
      .populate("slot");

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found"
    );
  }

  // User OR Owner can access

  const isUser =
    booking.user._id.toString() ===
    userId.toString();

  const isOwner =
    booking.owner._id.toString() ===
    userId.toString();

  if (!isUser && !isOwner) {
    throw new ApiError(
      403,
      "Unauthorized"
    );
  }

  return booking;

};

// ==========================================
// Get My Bookings
// ==========================================

const getMyBookings = async (
  userId,
  query = {}
) => {

  const {
    page = 1,
    limit = 10,
    status,
  } = query;

  const filter = {
    user: userId,
  };

  if (status) {
    filter.bookingStatus = status;
  }

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const bookings =
    await Booking.find(filter)
      .populate(
        "turf",
        "name images address"
      )
      .sort({
        bookingDate: -1,
      })
      .skip(skip)
      .limit(Number(limit));

  const total =
    await Booking.countDocuments(
      filter
    );

  return {

    bookings,

    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(
        total / Number(limit)
      ),
    },

  };

};

// ==========================================
// Get Upcoming Bookings
// ==========================================

const getUpcomingBookings =
  async (userId) => {

    const bookings =
      await Booking.find({

        user: userId,

        bookingStatus:
          "confirmed",

        bookingDate: {
          $gte: new Date(),
        },

      })
        .populate(
          "turf",
          "name images"
        )
        .sort({
          bookingDate: 1,
        });

    return bookings;

  };

// ==========================================
// Get Completed Bookings
// ==========================================

const getCompletedBookings =
  async (userId) => {

    const bookings =
      await Booking.find({

        user: userId,

        bookingStatus:
          "completed",

      })
        .populate(
          "turf",
          "name images"
        )
        .sort({
          bookingDate: -1,
        });

    return bookings;

  };
  // ==========================================
// Get Owner Bookings
// ==========================================

const getOwnerBookings = async (
  ownerId,
  query = {}
) => {

  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
  } = query;

  const filter = {
    owner: ownerId,
  };

  if (status) {
    filter.bookingStatus = status;
  }

  if (paymentStatus) {
    filter["payment.status"] =
      paymentStatus;
  }

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const bookings =
    await Booking.find(filter)
      .populate(
        "user",
        "name phone avatar"
      )
      .populate(
        "turf",
        "name images"
      )
      .sort({
        bookingDate: -1,
        startTime: 1,
      })
      .skip(skip)
      .limit(Number(limit));

  const total =
    await Booking.countDocuments(
      filter
    );

  return {
    bookings,

    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(
        total / Number(limit)
      ),
    },
  };

};

// ==========================================
// Get Turf Bookings
// ==========================================

const getTurfBookings = async (
  turfId,
  query = {},
  ownerId
) => {

  const turf = await Turf.findById(turfId);
  if (!turf || String(turf.owner) !== String(ownerId)) throw new ApiError(403, "Unauthorized turf access");
  const {
    page = 1,
    limit = 20,
  } = query;

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const bookings =
    await Booking.find({
      turf: turfId,
    })
      .populate(
        "user",
        "name phone avatar"
      )
      .sort({
        bookingDate: -1,
        startTime: 1,
      })
      .skip(skip)
      .limit(Number(limit));

  const total =
    await Booking.countDocuments({
      turf: turfId,
    });

  return {
    bookings,

    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(
        total / Number(limit)
      ),
    },
  };

};

// ==========================================
// Get Today's Bookings
// ==========================================

const getTodayBookings =
  async (ownerId) => {

    const today = new Date();

    const startOfDay =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

    const endOfDay =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

    const bookings =
      await Booking.find({

        owner: ownerId,

        bookingDate: {
          $gte: startOfDay,
          $lt: endOfDay,
        },

      })
        .populate(
          "user",
          "name phone"
        )
        .populate(
          "turf",
          "name"
        )
        .sort({
          startTime: 1,
        });

    return bookings;

  };

// ==========================================
// Booking Calendar
// ==========================================

const getBookingCalendar =
  async (
    ownerId,
    month,
    year
  ) => {

    const start =
      new Date(year, month - 1, 1);

    const end =
      new Date(year, month, 1);

    return await Booking.find({

      owner: ownerId,

      bookingDate: {
        $gte: start,
        $lt: end,
      },

    })
      .select(
        "bookingDate startTime endTime bookingStatus"
      )
      .populate(
        "turf",
        "name"
      );

  };

// ==========================================
// Owner Dashboard Summary
// ==========================================

const getOwnerDashboard =
  async (ownerId) => {

    const totalBookings =
      await Booking.countDocuments({
        owner: ownerId,
      });

    const completedBookings =
      await Booking.countDocuments({
        owner: ownerId,
        bookingStatus:
          "completed",
      });

    const cancelledBookings =
      await Booking.countDocuments({
        owner: ownerId,
        bookingStatus:
          "cancelled",
      });

    const revenue =
      await Booking.aggregate([
        {
          $match: {
            owner:
              ownerId,
            bookingStatus:
              "completed",
            "payment.status":
              "paid",
          },
        },
        {
          $group: {
            _id: null,

            revenue: {
              $sum:
                "$pricing.totalAmount",
            },
          },
        },
      ]);

    return {

      totalBookings,

      completedBookings,

      cancelledBookings,

      totalRevenue:
        revenue.length
          ? revenue[0].revenue
          : 0,

    };

};
// ==========================================
// Complete Booking
// ==========================================

const completeBooking = async (
  bookingId, ownerId
) => {

  const booking =
    await Booking.findById(
      bookingId
    );

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found"
    );
  }

  if (String(booking.owner) !== String(ownerId)) throw new ApiError(403, "Unauthorized booking access");
  if (
    booking.bookingStatus !==
    "confirmed"
  ) {
    throw new ApiError(
      400,
      "Only confirmed bookings can be completed"
    );
  }

  booking.bookingStatus =
    "completed";

  await booking.save();

  return booking;

};

// ==========================================
// Expire Booking
// ==========================================

const expireBooking = async (
  bookingId
) => {

  const booking =
    await Booking.findById(
      bookingId
    );

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found"
    );
  }

  if (
    booking.bookingStatus !==
    "pending"
  ) {
    return booking;
  }

  booking.bookingStatus =
    "expired";

  await booking.save();

  // Release Reserved Slot

  if (booking.slot) {
    await slotService.releaseSlot(
      booking.slot
    );
  }

  return booking;

};

// ==========================================
// Cleanup Expired Bookings
// ==========================================

const expirePendingBookings =
  async () => {

    const fifteenMinutesAgo =
      new Date(
        Date.now() -
          15 * 60 * 1000
      );

    const bookings =
      await Booking.find({

        bookingStatus:
          "pending",

        createdAt: {
          $lte:
            fifteenMinutesAgo,
        },

      });

    for (const booking of bookings) {

      booking.bookingStatus =
        "expired";

      await booking.save();

      if (booking.slot) {
        await slotService.releaseSlot(
          booking.slot
        );
      }

    }

    return bookings.length;

};

// ==========================================
// Delete Booking
// ==========================================

const deleteBooking = async (
  bookingId,
  userId
) => {

  const booking =
    await Booking.findById(
      bookingId
    );

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found"
    );
  }

  if (
    booking.user.toString() !==
    userId.toString()
  ) {
    throw new ApiError(
      403,
      "Unauthorized"
    );
  }

  if (
    booking.bookingStatus ===
    "confirmed"
  ) {
    throw new ApiError(
      400,
      "Confirmed booking cannot be deleted"
    );
  }

  await booking.deleteOne();

  return {
    message:
      "Booking deleted successfully",
  };

};

module.exports = {

  createBooking,

  verifyPayment,
  confirmBooking,

  cancelBooking,
  refundBooking,

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
  expireBooking,
  expirePendingBookings,

  deleteBooking,

};