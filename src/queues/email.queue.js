// src/queues/email.queue.js

const {
  createQueue,
  createQueueEvents,
} = require("../config/bullmq");

const emailQueue = createQueue("email", {

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

const emailEvents =
  createQueueEvents("email");

emailEvents.on(
  "completed",
  ({ jobId }) => {

    console.log(
      `✅ Email Job ${jobId} completed`
    );

  }
);

emailEvents.on(
  "failed",
  ({ jobId, failedReason }) => {

    console.error(

      `❌ Email Job ${jobId} failed`,

      failedReason

    );

  }
);

// ==========================================
// Queue Helpers
// ==========================================

// Generic Email

const sendEmail = async (
  data,
  options = {}
) => {

  return emailQueue.add(

    "send-email",

    data,

    {

      priority: 2,

      ...options,

    }

  );

};

// OTP

const sendOTP = async (

  email,

  otp,

  name

) => {

  return emailQueue.add(

    "send-otp",

    {

      email,

      otp,

      name,

    },

    {

      priority: 1,

    }

  );

};

// Welcome Email

const sendWelcomeEmail =
  async (

    email,

    name

  ) => {

    return emailQueue.add(

      "welcome-email",

      {

        email,

        name,

      }

    );

  };

// Booking Confirmation

const sendBookingConfirmation =
  async (

    booking

  ) => {

    return emailQueue.add(

      "booking-confirmation",

      booking

    );

  };

// Booking Cancelled

const sendBookingCancellation =
  async (

    booking

  ) => {

    return emailQueue.add(

      "booking-cancelled",

      booking

    );

  };

// Payment Success

const sendPaymentSuccess =
  async (

    payment

  ) => {

    return emailQueue.add(

      "payment-success",

      payment

    );

  };

// Refund

const sendRefundEmail =
  async (

    refund

  ) => {

    return emailQueue.add(

      "refund-email",

      refund

    );

  };

// Password Reset

const sendPasswordReset =
  async (

    email,

    token,

    name

  ) => {

    return emailQueue.add(

      "password-reset",

      {

        email,

        token,

        name,

      }

    );

  };

// ==========================================
// Exports
// ==========================================

module.exports = {

  emailQueue,

  emailEvents,

  sendEmail,

  sendOTP,

  sendWelcomeEmail,

  sendBookingConfirmation,

  sendBookingCancellation,

  sendPaymentSuccess,

  sendRefundEmail,

  sendPasswordReset,

};