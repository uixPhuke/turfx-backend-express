// src/socket/notification.socket.js

const Notification = require("../modules/notification/notification.model");

// ==========================================
// Notification Socket
// ==========================================

const registerNotificationSocket = (
  io,
  socket
) => {

  const userId = socket.user._id.toString();

  // ========================================
  // Join Notification Room
  // ========================================

  socket.on(
    "notification:join",
    () => {

      socket.join(
        `notifications:${userId}`
      );

      socket.emit(
        "notification:joined",
        {
          room: `notifications:${userId}`,
        }
      );

    }
  );

  // ========================================
  // Leave Notification Room
  // ========================================

  socket.on(
    "notification:leave",
    () => {

      socket.leave(
        `notifications:${userId}`
      );

    }
  );

  // ========================================
  // Get Notifications
  // ========================================

  socket.on(
    "notification:get",
    async () => {

      try {

        const notifications =
          await Notification.find({

            user: userId,

            isDeleted: false,

          })

            .sort({
              createdAt: -1,
            })

            .limit(20);

        socket.emit(
          "notification:list",
          notifications
        );

      } catch (error) {

        socket.emit(
          "notification:error",
          {
            message: error.message,
          }
        );

      }

    }
  );

  // ========================================
  // Mark One Notification Read
  // ========================================

  socket.on(
    "notification:read",
    async (
      notificationId
    ) => {

      try {

        await Notification.findOneAndUpdate(

          {

            _id: notificationId,

            user: userId,

          },

          {

            isRead: true,

          }

        );

        io.to(
          `notifications:${userId}`
        ).emit(
          "notification:updated",
          {

            notificationId,

            isRead: true,

          }
        );

      } catch (error) {

        socket.emit(
          "notification:error",
          {
            message: error.message,
          }
        );

      }

    }
  );

  // ========================================
  // Mark All Read
  // ========================================

  socket.on(
    "notification:read-all",
    async () => {

      try {

        await Notification.updateMany(

          {

            user: userId,

            isRead: false,

          },

          {

            $set: {

              isRead: true,

            },

          }

        );

        io.to(
          `notifications:${userId}`
        ).emit(
          "notification:all-read"
        );

      } catch (error) {

        socket.emit(
          "notification:error",
          {
            message: error.message,
          }
        );

      }

    }
  );

  // ========================================
  // Unread Count
  // ========================================

  socket.on(
    "notification:count",
    async () => {

      try {

        const count =
          await Notification.countDocuments({

            user: userId,

            isRead: false,

            isDeleted: false,

          });

        socket.emit(
          "notification:count",
          {
            unread: count,
          }
        );

      } catch (error) {

        socket.emit(
          "notification:error",
          {
            message: error.message,
          }
        );

      }

    }
  );

  // ========================================
  // Ping
  // ========================================

  socket.on(
    "notification:ping",
    () => {

      socket.emit(
        "notification:pong",
        {
          time: new Date(),
        }
      );

    }
  );

};

module.exports =
  registerNotificationSocket;