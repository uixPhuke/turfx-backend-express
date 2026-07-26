const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

const Notification = require("./notification.model");
const User = require("../user/user.model");

const ApiError = require("../../utils/ApiError");

// ==========================================
// Email Transporter
// ==========================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==========================================
// Send Push Notification (FCM)
// ==========================================

const sendPushNotification = async (
  fcmToken,
  title,
  message,
  data = {}
) => {

  if (!fcmToken) return;

  try {

    await admin.messaging().send({

      token: fcmToken,

      notification: {
        title,
        body: message,
      },

      data: Object.keys(data).reduce(
        (result, key) => {
          result[key] =
            String(data[key]);
          return result;
        },
        {}
      ),

    });

    return true;

  } catch (error) {

    console.error(
      "FCM Error:",
      error.message
    );

    return false;

  }

};

// ==========================================
// Send Email Notification
// ==========================================

const sendEmailNotification =
  async (
    email,
    subject,
    message
  ) => {

    if (!email) return;

    try {

      await transporter.sendMail({

        from:
          process.env.EMAIL_USER,

        to: email,

        subject,

        html: `
          <div style="font-family:Arial,sans-serif;">
            <h2>${subject}</h2>
            <p>${message}</p>
          </div>
        `,

      });

      return true;

    } catch (error) {

      console.error(
        "Email Error:",
        error.message
      );

      return false;

    }

  };
  // ==========================================
// Create Notification
// ==========================================

const createNotification = async (
  data
) => {

  const {

    receiver,
    sender = null,

    title,
    message,

    type,

    referenceType = "System",
    referenceId = null,

    attachments = [],

    channels = {
      inApp: true,
      push: false,
      email: false,
      sms: false,
    },

    priority = "normal",

    expiresAt = null,

    payload = {},

  } = data;

  // ========================================
  // Receiver
  // ========================================

  const user =
    await User.findById(receiver);

  if (!user) {
    throw new ApiError(
      404,
      "Receiver not found"
    );
  }

  // ========================================
  // Notification Document
  // ========================================

  const notification =
    new Notification({

      receiver,

      sender,

      title,

      message,

      type,

      referenceType,

      referenceId,

      attachments,

      channels,

      priority,

      expiresAt,

      data: payload,

    });

  // ========================================
  // Save In-App Notification
  // ========================================

  await notification.save();

  // ========================================
  // Delivery Results
  // ========================================

  const deliveryStatus = {

    inApp: true,

    push: false,

    email: false,

    sms: false,

  };
    // ========================================
  // Push Notification
  // ========================================

  if (channels.push && user.fcmToken) {

    deliveryStatus.push =
      await sendPushNotification(
        user.fcmToken,
        title,
        message,
        {
          type,
          referenceType,
          referenceId:
            referenceId
              ? referenceId.toString()
              : "",
        }
      );

  }

  // ========================================
  // Email Notification
  // ========================================

  if (channels.email && user.email) {

    deliveryStatus.email =
      await sendEmailNotification(
        user.email,
        title,
        message
      );

  }

  // ========================================
  // SMS (Future)
  // ========================================

  if (channels.sms) {

    // Integrate Twilio / MSG91 here

    deliveryStatus.sms = false;

  }

  // ========================================
  // Update Delivery Status
  // ========================================

  notification.deliveryStatus =
    deliveryStatus;

  await notification.save();

  // ========================================
  // Populate Response
  // ========================================

  await notification.populate([
    {
      path: "receiver",
      select:
        "name email avatar",
    },
    {
      path: "sender",
      select:
        "name email avatar",
    },
  ]);

  return notification;

};

// ==========================================
// Send Notification To One User
// ==========================================

const sendNotification = async (
  receiverId,
  options = {}
) => {

  const notification =
    await createNotification({

      receiver: receiverId,

      sender:
        options.sender || null,

      title:
        options.title,

      message:
        options.message,

      type:
        options.type,

      referenceType:
        options.referenceType,

      referenceId:
        options.referenceId,

      attachments:
        options.attachments || [],

      channels:
        options.channels || {
          inApp: true,
          push: true,
          email: false,
          sms: false,
        },

      priority:
        options.priority || "normal",

      expiresAt:
        options.expiresAt || null,

      payload:
        options.payload || {},

    });

  return notification;

};

// ==========================================
// Send Push To User
// ==========================================

const sendPushToUser = async (
  userId,
  title,
  message,
  data = {}
) => {

  const user =
    await User.findById(userId);

  if (!user) {
    throw new ApiError(
      404,
      "User not found"
    );
  }

  if (!user.fcmToken) {

    return {
      success: false,
      message:
        "User has no FCM token",
    };

  }

  const sent =
    await sendPushNotification(
      user.fcmToken,
      title,
      message,
      data
    );

  return {

    success: sent,

  };

};

// ==========================================
// Send Email To User
// ==========================================

const sendEmailToUser = async (
  userId,
  subject,
  message
) => {

  const user =
    await User.findById(userId);

  if (!user) {
    throw new ApiError(
      404,
      "User not found"
    );
  }

  if (!user.email) {

    return {

      success: false,

      message:
        "User has no email",

    };

  }

  const sent =
    await sendEmailNotification(
      user.email,
      subject,
      message
    );

  return {

    success: sent,

  };

};

// ==========================================
// Send Notification To Multiple Users
// ==========================================

const sendToMultipleUsers = async (
  userIds = [],
  options = {}
) => {

  const notifications = [];

  for (const userId of userIds) {

    try {

      const notification =
        await sendNotification(
          userId,
          options
        );

      notifications.push(notification);

    } catch (error) {

      console.error(
        `Failed to send notification to ${userId}:`,
        error.message
      );

    }

  }

  return notifications;

};

// ==========================================
// Send Notification To Role
// ==========================================

const sendToRole = async (
  role,
  options = {}
) => {

  const users =
    await User.find({
      role,
      isDeleted: false,
    }).select("_id");

  if (!users.length) {

    return [];

  }

  const userIds =
    users.map(
      (user) => user._id
    );

  return await sendToMultipleUsers(
    userIds,
    options
  );

};

// ==========================================
// Broadcast Notification
// ==========================================

const sendBroadcastNotification =
  async (options = {}) => {

    const users =
      await User.find({
        isDeleted: false,
      }).select("_id");

    if (!users.length) {

      return [];

    }

    const userIds =
      users.map(
        (user) => user._id
      );

    return await sendToMultipleUsers(
      userIds,
      options
    );

};

// ==========================================
// Get User Notifications
// ==========================================

const getUserNotifications = async (
  userId,
  query = {}
) => {

  const {
    page = 1,
    limit = 20,
    type,
    isRead,
  } = query;

  const filter = {

    receiver: userId,

    isDeleted: false,

  };

  if (type) {
    filter.type = type;
  }

  if (isRead !== undefined) {
    filter.isRead =
      isRead === "true";
  }

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const notifications =
    await Notification.find(filter)
      .populate(
        "sender",
        "name avatar"
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(Number(limit));

  const total =
    await Notification.countDocuments(
      filter
    );

  return {

    notifications,

    pagination: {

      total,

      page:
        Number(page),

      limit:
        Number(limit),

      pages:
        Math.ceil(
          total /
          Number(limit)
        ),

    },

  };

};

// ==========================================
// Get Notification By ID
// ==========================================

const getNotificationById =
  async (
    userId,
    notificationId
  ) => {

    const notification =
      await Notification.findOne({

        _id: notificationId,

        receiver: userId,

        isDeleted: false,

      })
        .populate(
          "sender",
          "name avatar email"
        );

    if (!notification) {

      throw new ApiError(
        404,
        "Notification not found"
      );

    }

    return notification;

};

// ==========================================
// Get Unread Count
// ==========================================

const getUnreadCount =
  async (userId) => {

    const unreadCount =
      await Notification.countDocuments({

        receiver: userId,

        isRead: false,

        isDeleted: false,

      });

    return {

      unreadCount,

    };

};

// ==========================================
// Mark Notification As Read
// ==========================================

const markAsRead = async (
  userId,
  notificationId
) => {

  const notification =
    await Notification.findOne({

      _id: notificationId,

      receiver: userId,

      isDeleted: false,

    });

  if (!notification) {

    throw new ApiError(
      404,
      "Notification not found"
    );

  }

  if (!notification.isRead) {

    notification.isRead = true;

    notification.readAt = new Date();

    await notification.save();

  }

  return notification;

};

// ==========================================
// Mark All Notifications As Read
// ==========================================

const markAllAsRead = async (
  userId
) => {

  const result =
    await Notification.updateMany(

      {

        receiver: userId,

        isRead: false,

        isDeleted: false,

      },

      {

        $set: {

          isRead: true,

          readAt: new Date(),

        },

      }

    );

  return {

    modifiedCount:
      result.modifiedCount,

  };

};

// ==========================================
// Delete Notification (Soft Delete)
// ==========================================

const deleteNotification = async (
  userId,
  notificationId
) => {

  const notification =
    await Notification.findOne({

      _id: notificationId,

      receiver: userId,

      isDeleted: false,

    });

  if (!notification) {

    throw new ApiError(
      404,
      "Notification not found"
    );

  }

  notification.isDeleted = true;

  await notification.save();

  return {

    success: true,

    message:
      "Notification deleted successfully",

  };

};

// ==========================================
// Delete All Notifications
// ==========================================

const deleteAllNotifications = async (
  userId
) => {

  const result =
    await Notification.updateMany(

      {
        receiver: userId,
        isDeleted: false,
      },

      {
        $set: {
          isDeleted: true,
        },
      }

    );

  return {

    success: true,

    deletedCount:
      result.modifiedCount,

  };

};

// ==========================================
// Cleanup Expired Notifications
// ==========================================

const cleanupExpiredNotifications =
  async () => {

    const now = new Date();

    const result =
      await Notification.deleteMany({

        expiresAt: {
          $ne: null,
          $lte: now,
        },

      });

    return {

      deletedCount:
        result.deletedCount,

    };

};

// ==========================================
// Notification Statistics
// ==========================================

const getNotificationStatistics =
  async (userId) => {

    const stats =
      await Notification.aggregate([

        {
          $match: {

            receiver: userId,

            isDeleted: false,

          },
        },

        {
          $group: {

            _id: null,

            totalNotifications: {
              $sum: 1,
            },

            unreadNotifications: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$isRead",
                      false,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            readNotifications: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$isRead",
                      true,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            highPriority: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$priority",
                      "high",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            urgentPriority: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$priority",
                      "urgent",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

          },

        },

      ]);

    return (

      stats[0] || {

        totalNotifications: 0,

        unreadNotifications: 0,

        readNotifications: 0,

        highPriority: 0,

        urgentPriority: 0,

      }

    );

};

// ==========================================
// Notification Analytics (Admin)
// ==========================================

const getNotificationAnalytics =
  async () => {

    const analytics =
      await Notification.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$type",

            total: {
              $sum: 1,
            },

            read: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$isRead",
                      true,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            unread: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$isRead",
                      false,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            highPriority: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$priority",
                      "high",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            urgentPriority: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$priority",
                      "urgent",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

          },
        },
        {
          $sort: {
            total: -1,
          },
        },
      ]);

    return analytics;

};

// ==========================================
// Delivery Report
// ==========================================

const getDeliveryReport =
  async () => {

    const report =
      await Notification.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,

            totalNotifications: {
              $sum: 1,
            },

            pushDelivered: {
              $sum: {
                $cond: [
                  "$deliveryStatus.push",
                  1,
                  0,
                ],
              },
            },

            emailDelivered: {
              $sum: {
                $cond: [
                  "$deliveryStatus.email",
                  1,
                  0,
                ],
              },
            },

            smsDelivered: {
              $sum: {
                $cond: [
                  "$deliveryStatus.sms",
                  1,
                  0,
                ],
              },
            },

            inAppDelivered: {
              $sum: {
                $cond: [
                  "$deliveryStatus.inApp",
                  1,
                  0,
                ],
              },
            },

          },
        },
      ]);

    return (
      report[0] || {
        totalNotifications: 0,
        pushDelivered: 0,
        emailDelivered: 0,
        smsDelivered: 0,
        inAppDelivered: 0,
      }
    );

};

// ==========================================
// Retry Failed Notifications
// ==========================================

const retryFailedNotifications =
  async () => {

    const notifications =
      await Notification.find({

        isDeleted: false,

        $or: [

          {
            "channels.push": true,
            "deliveryStatus.push": false,
          },

          {
            "channels.email": true,
            "deliveryStatus.email": false,
          },

        ],

      }).populate(
        "receiver",
        "email fcmToken"
      );

    let retried = 0;

    for (const notification of notifications) {

      // Retry Push

      if (
        notification.channels.push &&
        !notification.deliveryStatus.push &&
        notification.receiver?.fcmToken
      ) {

        notification.deliveryStatus.push =
          await sendPushNotification(
            notification.receiver.fcmToken,
            notification.title,
            notification.message,
            notification.data
          );

      }

      // Retry Email

      if (
        notification.channels.email &&
        !notification.deliveryStatus.email &&
        notification.receiver?.email
      ) {

        notification.deliveryStatus.email =
          await sendEmailNotification(
            notification.receiver.email,
            notification.title,
            notification.message
          );

      }

      await notification.save();

      retried++;

    }

    return {

      retried,

    };

};

// ==========================================
// Schedule Notification
// ==========================================

const scheduleNotification = async (
  data,
  scheduledFor
) => {

  const notification =
    await createNotification({

      ...data,

      channels: {
        inApp: false,
        push: false,
        email: false,
        sms: false,
      },

    });

  notification.scheduledFor =
    new Date(scheduledFor);

  notification.isScheduled = true;

  await notification.save();

  return notification;

};

// ==========================================
// Booking Reminder
// ==========================================

const sendBookingReminder =
  async (booking) => {

    return await sendNotification(
      booking.user,
      {

        title:
          "Booking Reminder",

        message: `Your booking for ${booking.turf.name} starts at ${booking.startTime}.`,

        type:
          "booking_reminder",

        referenceType:
          "Booking",

        referenceId:
          booking._id,

        channels: {

          inApp: true,
          push: true,
          email: true,

        },

        priority: "high",

      }
    );

};

// ==========================================
// Payment Reminder
// ==========================================

const sendPaymentReminder =
  async (booking) => {

    return await sendNotification(
      booking.user,
      {

        title:
          "Payment Pending",

        message:
          "Complete your payment before your booking expires.",

        type:
          "payment_failed",

        referenceType:
          "Booking",

        referenceId:
          booking._id,

        channels: {

          inApp: true,
          push: true,
          email: true,

        },

        priority: "urgent",

      }
    );

};

// ==========================================
// Process Scheduled Notifications
// ==========================================

const sendScheduledNotifications =
  async () => {

    const now = new Date();

    const notifications =
      await Notification.find({

        isScheduled: true,

        scheduledFor: {
          $lte: now,
        },

        isDeleted: false,

      });

    let processed = 0;

    for (const notification of notifications) {

      const receiver =
        await User.findById(
          notification.receiver
        );

      if (!receiver) continue;

      // Push

      if (
        notification.channels.push &&
        receiver.fcmToken
      ) {

        notification.deliveryStatus.push =
          await sendPushNotification(
            receiver.fcmToken,
            notification.title,
            notification.message,
            notification.data
          );

      }

      // Email

      if (
        notification.channels.email &&
        receiver.email
      ) {

        notification.deliveryStatus.email =
          await sendEmailNotification(
            receiver.email,
            notification.title,
            notification.message
          );

      }

      notification.channels.inApp = true;

      notification.deliveryStatus.inApp = true;

      notification.isScheduled = false;

      await notification.save();

      processed++;

    }

    return {

      processed,

    };

};

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  // Create
  createNotification,
  sendNotification,

  // Push
  sendPushNotification,
  sendPushToUser,

  // Email
  sendEmailNotification,
  sendEmailToUser,

  // Bulk
  sendToMultipleUsers,
  sendToRole,
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

  // Maintenance
  cleanupExpiredNotifications,

  // Statistics
  getNotificationStatistics,
  getNotificationAnalytics,
  getDeliveryReport,

  // Retry
  retryFailedNotifications,

  // Scheduler
  scheduleNotification,
  sendBookingReminder,
  sendPaymentReminder,
  sendScheduledNotifications,

};