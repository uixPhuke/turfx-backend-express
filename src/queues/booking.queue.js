// src/queues/booking.queue.js

const {
  createQueue,
  createQueueEvents,
} = require("../config/bullmq");

// ==========================================
// Queue
// ==========================================

const bookingQueue = createQueue("booking", {

  attempts: 5,

  backoff: {

    type: "exponential",

    delay: 5000,

  },

  removeOnComplete: 1000,

  removeOnFail: 5000,

});

// ==========================================
// Queue Events
// ==========================================

const bookingEvents =
  createQueueEvents("booking");

bookingEvents.on(
  "completed",
  ({ jobId }) => {

    console.log(
      `✅ Booking Job ${jobId} completed`
    );

  }
);

bookingEvents.on(
  "failed",
  ({ jobId, failedReason }) => {

    console.error(
      `❌ Booking Job ${jobId} failed`,
      failedReason
    );

  }
);

// ==========================================
// Booking Created
// ==========================================

const bookingCreated = async (
  booking,
  options = {}
) => {

  return bookingQueue.add(

    "booking-created",

    booking,

    {

      priority: 1,

      ...options,

    }

  );

};

// ==========================================
// Booking Confirmed
// ==========================================

const bookingConfirmed = async (
  booking
) => {

  return bookingQueue.add(

    "booking-confirmed",

    booking

  );

};

// ==========================================
// Booking Cancelled
// ==========================================

const bookingCancelled = async (
  booking
) => {

  return bookingQueue.add(

    "booking-cancelled",

    booking

  );

};

// ==========================================
// Booking Completed
// ==========================================

const bookingCompleted = async (
  booking
) => {

  return bookingQueue.add(

    "booking-completed",

    booking

  );

};

// ==========================================
// Booking Reminder
// ==========================================

const bookingReminder = async (
  booking,
  delay
) => {

  return bookingQueue.add(

    "booking-reminder",

    booking,

    {

      delay,

      priority: 2,

    }

  );

};

// ==========================================
// Auto Cancel
// ==========================================

const autoCancelBooking =
  async (
    booking,
    delay
  ) => {

    return bookingQueue.add(

      "booking-auto-cancel",

      booking,

      {

        delay,

        priority: 1,

      }

    );

  };

// ==========================================
// Update Analytics
// ==========================================

const updateBookingAnalytics =
  async (
    booking
  ) => {

    return bookingQueue.add(

      "booking-analytics",

      booking,

      {

        priority: 5,

      }

    );

  };

// ==========================================
// Sync Calendar
// ==========================================

const syncCalendar =
  async (
    booking
  ) => {

    return bookingQueue.add(

      "booking-calendar-sync",

      booking

    );

  };

// ==========================================
// Generate Invoice
// ==========================================

const generateInvoice =
  async (
    booking
  ) => {

    return bookingQueue.add(

      "booking-invoice",

      booking

    );

  };

// ==========================================
// Exports
// ==========================================

module.exports = {

  bookingQueue,

  bookingEvents,

  bookingCreated,

  bookingConfirmed,

  bookingCancelled,

  bookingCompleted,

  bookingReminder,

  autoCancelBooking,

  updateBookingAnalytics,

  syncCalendar,

  generateInvoice,

};