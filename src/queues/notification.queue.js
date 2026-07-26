// src/queues/notification.queue.js

const {
  createQueue,
  createQueueEvents,
} = require("../config/bullmq");

// ==========================================
// Queue
// ==========================================

const notificationQueue =
  createQueue("notification", {

    attempts: 5,

    backoff: {

      type: "exponential",

      delay: 3000,

    },

    removeOnComplete: 1000,

    removeOnFail: 5000,

  });

// ==========================================
// Queue Events
// ==========================================

const notificationEvents =
  createQueueEvents("notification");

notificationEvents.on(
  "completed",
  ({ jobId }) => {

    console.log(
      `✅ Notification Job ${jobId} completed`
    );

  }
);

notificationEvents.on(
  "failed",
  ({ jobId, failedReason }) => {

    console.error(
      `❌ Notification Job ${jobId} failed`,
      failedReason
    );

  }
);

// ==========================================
// Generic Notification
// ==========================================

const sendNotification = async (
  notification,
  options = {}
) => {

  return notificationQueue.add(

    "send-notification",

    notification,

    {

      priority: 2,

      ...options,

    }

  );

};

// ==========================================
// Push Notification
// ==========================================

const sendPushNotification =
  async (
    notification
  ) => {

    return notificationQueue.add(

      "push-notification",

      notification,

      {

        priority: 1,

      }

    );

  };

// ==========================================
// In-App Notification
// ==========================================

const sendInAppNotification =
  async (
    notification
  ) => {

    return notificationQueue.add(

      "in-app-notification",

      notification

    );

  };

// ==========================================
// Admin Broadcast
// ==========================================

const sendAdminBroadcast =
  async (
    notification
  ) => {

    return notificationQueue.add(

      "admin-broadcast",

      notification

    );

  };

// ==========================================
// Booking Notification
// ==========================================

const sendBookingNotification =
  async (
    booking
  ) => {

    return notificationQueue.add(

      "booking-notification",

      booking

    );

  };

// ==========================================
// Payment Notification
// ==========================================

const sendPaymentNotification =
  async (
    payment
  ) => {

    return notificationQueue.add(

      "payment-notification",

      payment

    );

  };

// ==========================================
// Wallet Notification
// ==========================================

const sendWalletNotification =
  async (
    wallet
  ) => {

    return notificationQueue.add(

      "wallet-notification",

      wallet

    );

  };

// ==========================================
// Review Notification
// ==========================================

const sendReviewNotification =
  async (
    review
  ) => {

    return notificationQueue.add(

      "review-notification",

      review

    );

  };

// ==========================================
// Owner Notification
// ==========================================

const sendOwnerNotification =
  async (
    owner
  ) => {

    return notificationQueue.add(

      "owner-notification",

      owner

    );

  };

// ==========================================
// Turf Notification
// ==========================================

const sendTurfNotification =
  async (
    turf
  ) => {

    return notificationQueue.add(

      "turf-notification",

      turf

    );

  };

// ==========================================
// Exports
// ==========================================

module.exports = {

  notificationQueue,

  notificationEvents,

  sendNotification,

  sendPushNotification,

  sendInAppNotification,

  sendAdminBroadcast,

  sendBookingNotification,

  sendPaymentNotification,

  sendWalletNotification,

  sendReviewNotification,

  sendOwnerNotification,

  sendTurfNotification,

};