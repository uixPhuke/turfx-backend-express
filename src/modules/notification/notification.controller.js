// src/modules/notification/notification.controller.js

const notificationService = require("./notification.service");

const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../middlewares/async.middleware");

// ==========================================
// Create Notification
// ==========================================

const createNotification = asyncHandler(
  async (req, res) => {

    const notification =
      await notificationService.createNotification(
        req.body
      );

    return res.status(201).json(
      new ApiResponse(
        201,
        notification,
        "Notification created successfully"
      )
    );

  }
);

// ==========================================
// Send Notification
// ==========================================

const sendNotification = asyncHandler(
  async (req, res) => {

    const notification =
      await notificationService.sendNotification(
        req.body.receiver,
        {
          sender: req.user?._id || null,

          title: req.body.title,

          message: req.body.message,

          type: req.body.type,

          referenceType:
            req.body.referenceType,

          referenceId:
            req.body.referenceId,

          attachments:
            req.body.attachments,

          channels:
            req.body.channels,

          priority:
            req.body.priority,

          expiresAt:
            req.body.expiresAt,

          payload:
            req.body.payload,
        }
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        notification,
        "Notification sent successfully"
      )
    );

  }
);

// ==========================================
// Broadcast Notification
// ==========================================

const sendBroadcastNotification =
  asyncHandler(
    async (req, res) => {

      const notifications =
        await notificationService.sendBroadcastNotification(
          {
            sender:
              req.user?._id || null,

            title:
              req.body.title,

            message:
              req.body.message,

            type:
              req.body.type || "system",

            channels:
              req.body.channels,

            priority:
              req.body.priority,

            expiresAt:
              req.body.expiresAt,

            payload:
              req.body.payload,
          }
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          notifications,
          "Broadcast notification sent successfully"
        )
      );

    }
  );
  // ==========================================
// Get User Notifications
// ==========================================

const getUserNotifications = asyncHandler(
  async (req, res) => {

    const notifications =
      await notificationService.getUserNotifications(
        req.user._id,
        req.query
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        notifications,
        "Notifications fetched successfully"
      )
    );

  }
);

// ==========================================
// Get Notification By ID
// ==========================================

const getNotificationById = asyncHandler(
  async (req, res) => {

    const notification =
      await notificationService.getNotificationById(
        req.user._id,
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        notification,
        "Notification fetched successfully"
      )
    );

  }
);

// ==========================================
// Get Unread Count
// ==========================================

const getUnreadCount = asyncHandler(
  async (req, res) => {

    const count =
      await notificationService.getUnreadCount(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        count,
        "Unread notification count fetched successfully"
      )
    );

  }
);

// ==========================================
// Mark Notification As Read
// ==========================================

const markAsRead = asyncHandler(
  async (req, res) => {

    const notification =
      await notificationService.markAsRead(
        req.user._id,
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        notification,
        "Notification marked as read"
      )
    );

  }
);

// ==========================================
// Mark All Notifications As Read
// ==========================================

const markAllAsRead = asyncHandler(
  async (req, res) => {

    const result =
      await notificationService.markAllAsRead(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "All notifications marked as read"
      )
    );

  }
);
// ==========================================
// Delete Notification
// ==========================================

const deleteNotification = asyncHandler(
  async (req, res) => {

    const result =
      await notificationService.deleteNotification(
        req.user._id,
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Notification deleted successfully"
      )
    );

  }
);

// ==========================================
// Delete All Notifications
// ==========================================

const deleteAllNotifications =
  asyncHandler(
    async (req, res) => {

      const result =
        await notificationService.deleteAllNotifications(
          req.user._id
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          result,
          "All notifications deleted successfully"
        )
      );

    }
  );

// ==========================================
// Notification Statistics
// ==========================================

const getNotificationStatistics =
  asyncHandler(
    async (req, res) => {

      const statistics =
        await notificationService.getNotificationStatistics(
          req.user._id
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          statistics,
          "Notification statistics fetched successfully"
        )
      );

    }
  );

// ==========================================
// Notification Analytics (Admin)
// ==========================================

const getNotificationAnalytics =
  asyncHandler(
    async (req, res) => {

      const analytics =
        await notificationService.getNotificationAnalytics();

      return res.status(200).json(
        new ApiResponse(
          200,
          analytics,
          "Notification analytics fetched successfully"
        )
      );

    }
  );

// ==========================================
// Delivery Report (Admin)
// ==========================================

const getDeliveryReport =
  asyncHandler(
    async (req, res) => {

      const report =
        await notificationService.getDeliveryReport();

      return res.status(200).json(
        new ApiResponse(
          200,
          report,
          "Delivery report fetched successfully"
        )
      );

    }
  );

// ==========================================
// Retry Failed Notifications (Admin)
// ==========================================

const retryFailedNotifications =
  asyncHandler(
    async (req, res) => {

      const result =
        await notificationService.retryFailedNotifications();

      return res.status(200).json(
        new ApiResponse(
          200,
          result,
          "Failed notifications retried successfully"
        )
      );

    }
  );

// ==========================================
// Schedule Notification
// ==========================================

const scheduleNotification =
  asyncHandler(
    async (req, res) => {

      const notification =
        await notificationService.scheduleNotification(
          req.body,
          req.body.scheduledFor
        );

      return res.status(201).json(
        new ApiResponse(
          201,
          notification,
          "Notification scheduled successfully"
        )
      );

    }
  );

// ==========================================
// Process Scheduled Notifications
// ==========================================

const sendScheduledNotifications =
  asyncHandler(
    async (req, res) => {

      const result =
        await notificationService.sendScheduledNotifications();

      return res.status(200).json(
        new ApiResponse(
          200,
          result,
          "Scheduled notifications processed successfully"
        )
      );

    }
  );

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  // Create & Send
  createNotification,
  sendNotification,
  sendBroadcastNotification,

  // Read
  getUserNotifications,
  getNotificationById,
  getUnreadCount,

  // Update
  markAsRead,
  markAllAsRead,

  // Delete
  deleteNotification,
  deleteAllNotifications,

  // Statistics
  getNotificationStatistics,

  // Admin
  getNotificationAnalytics,
  getDeliveryReport,
  retryFailedNotifications,

  // Scheduler
  scheduleNotification,
  sendScheduledNotifications,

};