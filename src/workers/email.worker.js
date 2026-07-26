// src/workers/email.worker.js

const { createWorker } = require("../config/bullmq");

const {
  sendOTPEmail,
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendPaymentSuccessEmail,
  sendRefundEmail,
  sendPasswordResetEmail,
  sendMail,
} = require("../utils/mail");

// ==========================================
// Email Worker
// ==========================================

const emailWorker = createWorker(
  "email",
  async (job) => {

    const { name, data } = job;

    switch (name) {

      // ======================================
      // OTP
      // ======================================

      case "send-otp":

        await sendOTPEmail(

          data.email,

          data.otp,

          data.name

        );

        break;

      // ======================================
      // Welcome Email
      // ======================================

      case "welcome-email":

        await sendWelcomeEmail(

          data.email,

          data.name

        );

        break;

      // ======================================
      // Booking Confirmation
      // ======================================

      case "booking-confirmation":

        await sendBookingConfirmationEmail(
          data
        );

        break;

      // ======================================
      // Booking Cancellation
      // ======================================

      case "booking-cancelled":

        await sendBookingCancellationEmail(
          data
        );

        break;

      // ======================================
      // Payment Success
      // ======================================

      case "payment-success":

        await sendPaymentSuccessEmail(
          data
        );

        break;

      // ======================================
      // Refund
      // ======================================

      case "refund-email":

        await sendRefundEmail(
          data
        );

        break;

      // ======================================
      // Password Reset
      // ======================================

      case "password-reset":

        await sendPasswordResetEmail(

          data.email,

          data.token,

          data.name

        );

        break;

      // ======================================
      // Generic Email
      // ======================================

      case "send-email":

        await sendMail({

          to: data.to,

          subject: data.subject,

          html: data.html,

          text: data.text,

          attachments: data.attachments || [],

        });

        break;

      default:

        throw new Error(
          `Unknown email job: ${name}`
        );

    }

    return {

      success: true,

      processedAt: new Date(),

      jobId: job.id,

    };

  },
  {

    concurrency: 10,

  }
);

// ==========================================
// Worker Events
// ==========================================

emailWorker.on(
  "completed",
  (job) => {

    console.log(
      `✅ Email Job ${job.id} completed`
    );

  }
);

emailWorker.on(
  "failed",
  (job, err) => {

    console.error(

      ` Email Job ${job?.id} failed:`,

      err.message

    );

  }
);

emailWorker.on(
  "error",
  (err) => {

    console.error(
      "Email Worker Error:",
      err.message
    );

  }
);

module.exports = emailWorker;