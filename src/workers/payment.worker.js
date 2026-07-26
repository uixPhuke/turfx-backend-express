// src/workers/payment.worker.js

const { createWorker } = require("../config/bullmq");

const Payment = require("../modules/payment/payment.model");
const Booking = require("../modules/booking/booking.model");

const paymentService = require("../modules/payment/payment.service");
const walletService = require("../modules/wallet/wallet.service");

const cacheService = require("../services/cache.service");

const {
  sendPaymentSuccess,
  sendRefundEmail,
} = require("../queues/email.queue");

const {
  sendPaymentNotification,
} = require("../queues/notification.queue");

// ==========================================
// Payment Worker
// ==========================================

const paymentWorker = createWorker(
  "payment",
  async (job) => {

    const { name, data } = job;

    switch (name) {

      // ======================================
      // Payment Verified
      // ======================================

      case "payment-verified": {

        await paymentService.verifyPayment(
          data.paymentId
        );

        break;
      }

      // ======================================
      // Payment Success
      // ======================================

      case "payment-success": {

        const payment =
          await Payment.findById(
            data.paymentId
          )
          .populate("user")
          .populate("booking");

        if (!payment) {
          throw new Error(
            "Payment not found"
          );
        }

        payment.paymentStatus = "success";
        await payment.save();

        if (payment.booking) {

          payment.booking.status =
            "confirmed";

          await payment.booking.save();

        }

        await sendPaymentSuccess({

          paymentId: payment._id,

          email: payment.user.email,

          payment,

        });

        await sendPaymentNotification({

          userId: payment.user._id,

          paymentId: payment._id,

          title: "Payment Successful",

          body:
            "Your payment has been completed successfully.",

        });

        await cacheService.invalidateDashboard();
        await cacheService.invalidateAnalytics();

        break;
      }

      // ======================================
      // Payment Failed
      // ======================================

      case "payment-failed": {

        const payment =
          await Payment.findById(
            data.paymentId
          );

        if (!payment) {
          throw new Error(
            "Payment not found"
          );
        }

        payment.paymentStatus = "failed";

        await payment.save();

        break;
      }

      // ======================================
      // Refund
      // ======================================

      case "payment-refund": {

        await paymentService.processRefund(
          data.paymentId
        );

        await sendRefundEmail({
          paymentId: data.paymentId,
        });

        break;
      }

      // ======================================
      // Wallet Credit
      // ======================================

      case "wallet-credit": {

        await walletService.creditWallet({

          userId: data.userId,

          amount: data.amount,

          description:
            "Cashback",

        });

        break;
      }

      // ======================================
      // Invoice
      // ======================================

      case "payment-invoice": {

        console.log(
          `Generate invoice for payment ${data.paymentId}`
        );

        break;
      }

      // ======================================
      // Analytics
      // ======================================

      case "payment-analytics": {

        await cacheService.invalidateDashboard();

        await cacheService.invalidateAnalytics();

        break;
      }

      // ======================================
      // Owner Settlement
      // ======================================

      case "owner-settlement": {

        console.log(
          `Settlement for payment ${data.paymentId}`
        );

        break;
      }

      default:

        throw new Error(
          `Unknown payment job: ${name}`
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

paymentWorker.on(
  "completed",
  (job) => {

    console.log(
      `✅ Payment Job ${job.id} completed`
    );

  }
);

paymentWorker.on(
  "failed",
  (job, error) => {

    console.error(

      ` Payment Job ${job?.id} failed:`,

      error.message

    );

  }
);

paymentWorker.on(
  "error",
  (error) => {

    console.error(
      "Payment Worker Error:",
      error.message
    );

  }
);

module.exports = paymentWorker;