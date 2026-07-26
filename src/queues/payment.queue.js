// src/queues/payment.queue.js

const {
  createQueue,
  createQueueEvents,
} = require("../config/bullmq");

// ==========================================
// Queue
// ==========================================

const paymentQueue = createQueue("payment", {

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

const paymentEvents =
  createQueueEvents("payment");

paymentEvents.on(
  "completed",
  ({ jobId }) => {

    console.log(
      `✅ Payment Job ${jobId} completed`
    );

  }
);

paymentEvents.on(
  "failed",
  ({ jobId, failedReason }) => {

    console.error(
      `❌ Payment Job ${jobId} failed`,
      failedReason
    );

  }
);

// ==========================================
// Payment Verified
// ==========================================

const paymentVerified = async (
  payment,
  options = {}
) => {

  return paymentQueue.add(

    "payment-verified",

    payment,

    {

      priority: 1,

      jobId: `payment-verified:${payment.paymentId}`,

      ...options,

    }

  );

};

// ==========================================
// Payment Success
// ==========================================

const paymentSuccess = async (
  payment
) => {

  return paymentQueue.add(

    "payment-success",

    payment,

    {

      priority: 1,

      jobId: `payment-success:${payment.paymentId}`,

    }

  );

};

// ==========================================
// Payment Failed
// ==========================================

const paymentFailed = async (
  payment
) => {

  return paymentQueue.add(

    "payment-failed",

    payment,

    {

      priority: 2,

      jobId: `payment-failed:${payment.paymentId}`,

    }

  );

};

// ==========================================
// Refund
// ==========================================

const processRefund = async (
  refund
) => {

  return paymentQueue.add(

    "payment-refund",

    refund,

    {

      priority: 1,

      jobId: `refund:${refund.paymentId}`,

    }

  );

};

// ==========================================
// Wallet Credit
// ==========================================

const creditWallet = async (
  wallet
) => {

  return paymentQueue.add(

    "wallet-credit",

    wallet,

    {

      priority: 2,

      jobId: `wallet:${wallet.userId}:${wallet.paymentId}`,

    }

  );

};

// ==========================================
// Invoice
// ==========================================

const generateInvoice = async (
  invoice
) => {

  return paymentQueue.add(

    "payment-invoice",

    invoice,

    {

      priority: 3,

      jobId: `invoice:${invoice.paymentId}`,

    }

  );

};

// ==========================================
// Analytics
// ==========================================

const updatePaymentAnalytics =
  async (
    payment
  ) => {

    return paymentQueue.add(

      "payment-analytics",

      payment,

      {

        priority: 5,

        jobId: `analytics:${payment.paymentId}`,

      }

    );

  };

// ==========================================
// Settlement
// ==========================================

const settleOwnerPayment =
  async (
    payment
  ) => {

    return paymentQueue.add(

      "owner-settlement",

      payment,

      {

        priority: 4,

        jobId: `settlement:${payment.paymentId}`,

      }

    );

  };

// ==========================================
// Exports
// ==========================================

module.exports = {

  paymentQueue,

  paymentEvents,

  paymentVerified,

  paymentSuccess,

  paymentFailed,

  processRefund,

  creditWallet,

  generateInvoice,

  updatePaymentAnalytics,

  settleOwnerPayment,

};