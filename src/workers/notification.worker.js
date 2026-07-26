// src/workers/notification.worker.js

const { createWorker } = require("../config/bullmq");

const notificationService = require("../modules/notification/notification.service");

// Optional FCM Service
const firebaseService = require("../services/firebase.service");

// ==========================================
// Notification Worker
// ==========================================

const notificationWorker = createWorker(
  "notification",
  async (job) => {

    const { name, data } = job;

    switch (name) {

      // ======================================
      // Generic Notification
      // ======================================

      case "send-notification":

        await notificationService.createNotification(data);

        break;

      // ======================================
      // Push Notification
      // ======================================

      case "push-notification":

        await firebaseService.sendPushNotification({

          userId: data.userId,

          title: data.title,

          body: data.body,

          image: data.image,

          data: data.data,

        });

        break;

      // ======================================
      // In-App Notification
      // ======================================

      case "in-app-notification":

        await notificationService.createNotification(data);

        break;

      // ======================================
      // Admin Broadcast
      // ======================================

      case "admin-broadcast":

        await notificationService.broadcastNotification(data);

        break;

      // ======================================
      // Booking Notification
      // ======================================

      case "booking-notification":

        await notificationService.sendBookingNotification(data);

        break;

      // ======================================
      // Payment Notification
      // ======================================

      case "payment-notification":

        await notificationService.sendPaymentNotification(data);

        break;

      // ======================================
      // Wallet Notification
      // ======================================

      case "wallet-notification":

        await notificationService.sendWalletNotification(data);

        break;

      // ======================================
      // Review Notification
      // ======================================

      case "review-notification":

        await notificationService.sendReviewNotification(data);

        break;

      // ======================================
      // Owner Notification
      // ======================================

      case "owner-notification":

        await notificationService.sendOwnerNotification(data);

        break;

      // ======================================
      // Turf Notification
      // ======================================

      case "turf-notification":

        await notificationService.sendTurfNotification(data);

        break;

      default:

        throw new Error(
          `Unknown notification job: ${name}`
        );

    }

    return {

      success: true,

      jobId: job.id,

      processedAt: new Date(),

    };

  },
  {

    concurrency: 20,

  }
);

// ==========================================
// Worker Events
// ==========================================

notificationWorker.on(
  "completed",
  (job) => {

    console.log(
      `✅ Notification Job ${job.id} completed`
    );

  }
);

notificationWorker.on(
  "failed",
  (job, error) => {

    console.error(

      `❌ Notification Job ${job?.id} failed:`,

      error.message

    );

  }
);

notificationWorker.on(
  "error",
  (error) => {

    console.error(

      "Notification Worker Error:",

      error.message

    );

  }
);

module.exports = notificationWorker;