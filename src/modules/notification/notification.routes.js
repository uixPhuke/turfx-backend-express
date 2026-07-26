// src/modules/notification/notification.routes.js

const express = require("express");

const router = express.Router();

const notificationController = require("./notification.controller");

const {
  createNotificationValidation,
  sendNotificationValidation,
  notificationIdValidation,
  markAsReadValidation,
  markAllAsReadValidation,
  deleteNotificationValidation,
  searchNotificationValidation,
  paginationValidation,
  broadcastNotificationValidation,
} = require("./notification.validation");

const auth = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validation.middleware");

// ==========================================
// User Routes
// ==========================================

// Get User Notifications
router.get(
  "/",
  auth,
  searchNotificationValidation,
  paginationValidation,
  validate,
  notificationController.getUserNotifications
);

// Get Unread Count
router.get(
  "/unread-count",
  auth,
  notificationController.getUnreadCount
);

// Get Notification By ID
router.get(
  "/:id",
  auth,
  notificationIdValidation,
  validate,
  notificationController.getNotificationById
);

// Mark Notification As Read
router.patch(
  "/:id/read",
  auth,
  markAsReadValidation,
  validate,
  notificationController.markAsRead
);

// Mark All Notifications As Read
router.patch(
  "/read-all",
  auth,
  markAllAsReadValidation,
  validate,
  notificationController.markAllAsRead
);

// Delete Notification
router.delete(
  "/:id",
  auth,
  deleteNotificationValidation,
  validate,
  notificationController.deleteNotification
);

// Delete All Notifications
router.delete(
  "/",
  auth,
  notificationController.deleteAllNotifications
);

// Notification Statistics
router.get(
  "/statistics/me",
  auth,
  notificationController.getNotificationStatistics
);

// ==========================================
// Admin Routes
// ==========================================

// Create Notification
router.post(
  "/admin/create",
  auth,
  authorize("admin"),
  createNotificationValidation,
  validate,
  notificationController.createNotification
);

// Send Notification
router.post(
  "/admin/send",
  auth,
  authorize("admin"),
  sendNotificationValidation,
  validate,
  notificationController.sendNotification
);

// Broadcast Notification
router.post(
  "/admin/broadcast",
  auth,
  authorize("admin"),
  broadcastNotificationValidation,
  validate,
  notificationController.sendBroadcastNotification
);

// Notification Analytics
router.get(
  "/admin/analytics",
  auth,
  authorize("admin"),
  notificationController.getNotificationAnalytics
);

// Delivery Report
router.get(
  "/admin/delivery-report",
  auth,
  authorize("admin"),
  notificationController.getDeliveryReport
);

// Retry Failed Notifications
router.post(
  "/admin/retry",
  auth,
  authorize("admin"),
  notificationController.retryFailedNotifications
);

// Schedule Notification
router.post(
  "/admin/schedule",
  auth,
  authorize("admin"),
  createNotificationValidation,
  validate,
  notificationController.scheduleNotification
);

// Process Scheduled Notifications
router.post(
  "/admin/process",
  auth,
  authorize("admin"),
  notificationController.sendScheduledNotifications
);

// ==========================================
// Export
// ==========================================

module.exports = router;