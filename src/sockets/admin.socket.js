// src/socket/admin.socket.js

const adminService = require("../modules/admin/admin.service");

// ==========================================
// Admin Socket
// ==========================================

const registerAdminSocket = (
  io,
  socket
) => {

  // Only Admins
  if (
    socket.user.role !== "admin" &&
    socket.user.role !== "super_admin"
  ) {
    return;
  }

  const adminId =
    socket.user._id.toString();

  // ========================================
  // Join Admin Dashboard
  // ========================================

  socket.on(
    "admin:join-dashboard",
    () => {

      socket.join(
        `admin:${adminId}`
      );

      socket.join("admins");

      socket.emit(
        "admin:joined",
        {
          room: `admin:${adminId}`,
        }
      );

    }
  );

  // ========================================
  // Leave Dashboard
  // ========================================

  socket.on(
    "admin:leave-dashboard",
    () => {

      socket.leave(
        `admin:${adminId}`
      );

      socket.leave("admins");

    }
  );

  // ========================================
  // Dashboard Statistics
  // ========================================

  socket.on(
    "admin:dashboard",
    async () => {

      try {

        const stats =
          await adminService.getDashboardStatistics();

        socket.emit(
          "admin:dashboard",
          stats
        );

      } catch (error) {

        socket.emit(
          "admin:error",
          {
            message: error.message,
          }
        );

      }

    }
  );

  // ========================================
  // Revenue Analytics
  // ========================================

  socket.on(
    "admin:revenue",
    async () => {

      try {

        const revenue =
          await adminService.getRevenueAnalytics();

        socket.emit(
          "admin:revenue",
          revenue
        );

      } catch (error) {

        socket.emit(
          "admin:error",
          {
            message: error.message,
          }
        );

      }

    }
  );

  // ========================================
  // Platform Analytics
  // ========================================

  socket.on(
    "admin:analytics",
    async () => {

      try {

        const analytics =
          await adminService.getPlatformAnalytics();

        socket.emit(
          "admin:analytics",
          analytics
        );

      } catch (error) {

        socket.emit(
          "admin:error",
          {
            message: error.message,
          }
        );

      }

    }
  );

  // ========================================
  // Recent Activities
  // ========================================

  socket.on(
    "admin:activities",
    async () => {

      try {

        const activities =
          await adminService.getRecentActivities();

        socket.emit(
          "admin:activities",
          activities
        );

      } catch (error) {

        socket.emit(
          "admin:error",
          {
            message: error.message,
          }
        );

      }

    }
  );

  // ========================================
  // System Health
  // ========================================

  socket.on(
    "admin:health",
    async () => {

      try {

        const health =
          await adminService.getSystemHealth();

        socket.emit(
          "admin:health",
          health
        );

      } catch (error) {

        socket.emit(
          "admin:error",
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
    "admin:ping",
    () => {

      socket.emit(
        "admin:pong",
        {
          time: new Date(),
        }
      );

    }
  );

};

module.exports =
  registerAdminSocket;