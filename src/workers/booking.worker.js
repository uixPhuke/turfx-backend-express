// src/workers/booking.worker.js

const { createWorker } = require("../config/bullmq");

const Booking = require("../modules/booking/booking.model");

const bookingService = require("../modules/booking/booking.service");

const {
  sendBookingConfirmation,
  sendBookingCancellation,
} = require("../queues/email.queue");

const {
  sendBookingNotification,
} = require("../queues/notification.queue");

const cacheService = require("../services/cache.service");

// ==========================================
// Booking Worker
// ==========================================

const bookingWorker = createWorker(
  "booking",
  async (job) => {

    const { name, data } = job;

    switch (name) {

      // ======================================
      // Booking Created
      // ======================================

      case "booking-created": {

        const booking =
          await Booking.findById(
            data.bookingId
          )
          .populate("user")
          .populate("turf")
          .populate("slot");

        if (!booking) {
          throw new Error(
            "Booking not found"
          );
        }

        await sendBookingConfirmation({
          bookingId: booking._id,
          email: booking.user.email,
          booking,
        });

        await sendBookingNotification({
          userId: booking.user._id,
          bookingId: booking._id,
          title: "Booking Created",
          body:
            "Your booking has been created successfully.",
        });

        break;
      }

      // ======================================
      // Booking Confirmed
      // ======================================

      case "booking-confirmed": {

        const booking =
          await Booking.findById(
            data.bookingId
          );

        if (!booking) {
          throw new Error(
            "Booking not found"
          );
        }

        booking.status =
          "confirmed";

        await booking.save();

        break;
      }

      // ======================================
      // Booking Cancelled
      // ======================================

      case "booking-cancelled": {

        const booking =
          await Booking.findById(
            data.bookingId
          )
          .populate("user");

        if (!booking) {
          throw new Error(
            "Booking not found"
          );
        }

        await sendBookingCancellation({
          bookingId: booking._id,
          email: booking.user.email,
          booking,
        });

        await sendBookingNotification({
          userId: booking.user._id,
          bookingId: booking._id,
          title: "Booking Cancelled",
          body:
            "Your booking has been cancelled.",
        });

        break;
      }

      // ======================================
      // Booking Completed
      // ======================================

      case "booking-completed": {

        const booking =
          await Booking.findById(
            data.bookingId
          );

        if (!booking) {
          throw new Error(
            "Booking not found"
          );
        }

        booking.status =
          "completed";

        await booking.save();

        break;
      }

      // ======================================
      // Booking Reminder
      // ======================================

      case "booking-reminder": {

        const booking =
          await Booking.findById(
            data.bookingId
          )
          .populate("user");

        if (!booking) {
          throw new Error(
            "Booking not found"
          );
        }

        await sendBookingNotification({
          userId: booking.user._id,
          bookingId: booking._id,
          title: "Upcoming Booking",
          body:
            "Your game starts in 30 minutes.",
        });

        break;
      }

      // ======================================
      // Auto Cancel
      // ======================================

      case "booking-auto-cancel": {

        await bookingService.autoCancelBooking(
          data.bookingId
        );

        break;
      }

      // ======================================
      // Analytics
      // ======================================

      case "booking-analytics": {

        await cacheService.invalidateDashboard();

        await cacheService.invalidateAnalytics();

        break;
      }

      // ======================================
      // Calendar Sync
      // ======================================

      case "booking-calendar-sync": {

        console.log(
          `Sync booking ${data.bookingId} with external calendar`
        );

        break;
      }

      // ======================================
      // Invoice
      // ======================================

      case "booking-invoice": {

        console.log(
          `Generate invoice for booking ${data.bookingId}`
        );

        break;
      }

      default:

        throw new Error(
          `Unknown booking job: ${name}`
        );

    }

    return {

      success: true,

      jobId: job.id,

      processedAt: new Date(),

    };

  },
  {

    concurrency: 10,

  }
);

// ==========================================
// Worker Events
// ==========================================

bookingWorker.on(
  "completed",
  (job) => {

    console.log(
      `✅ Booking Job ${job.id} completed`
    );

  }
);

bookingWorker.on(
  "failed",
  (job, error) => {

    console.error(

      ` Booking Job ${job?.id} failed:`,

      error.message

    );

  }
);

bookingWorker.on(
  "error",
  (error) => {

    console.error(
      "Booking Worker Error:",
      error.message
    );

  }
);

module.exports = bookingWorker;