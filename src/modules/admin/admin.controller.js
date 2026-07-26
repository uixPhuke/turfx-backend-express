// src/modules/admin/admin.controller.js

const adminService = require("./admin.service");

const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../middlewares/async.middleware");

// ==========================================
// Register Admin
// ==========================================

const registerAdmin = asyncHandler(
  async (req, res) => {

    const result =
      await adminService.registerAdmin({

        ...req.body,

        createdBy: req.user?._id || null,

      });

    return res.status(201).json(
      new ApiResponse(
        201,
        result,
        "Admin registered successfully"
      )
    );

  }
);

// ==========================================
// Login Admin
// ==========================================

const loginAdmin = asyncHandler(
  async (req, res) => {

    const result =
      await adminService.loginAdmin(

        req.body.email,

        req.body.password,

        req.ip,

        req.get("user-agent")

      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Login successful"
      )
    );

  }
);

// ==========================================
// Refresh Access Token
// ==========================================

const refreshAccessToken =
  asyncHandler(
    async (req, res) => {

      const refreshToken =

        req.body.refreshToken ||

        req.cookies?.refreshToken;

      const result =
        await adminService.refreshAccessToken(
          refreshToken
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          result,
          "Access token refreshed successfully"
        )
      );

    }
  );

// ==========================================
// Logout Admin
// ==========================================

const logoutAdmin =
  asyncHandler(
    async (req, res) => {

      const result =
        await adminService.logoutAdmin(
          req.user._id
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          result,
          "Logout successful"
        )
      );

    }
  );

// ==========================================
// Change Password
// ==========================================

const changePassword =
  asyncHandler(
    async (req, res) => {

      const result =
        await adminService.changePassword(

          req.user._id,

          req.body.currentPassword,

          req.body.newPassword

        );

      return res.status(200).json(
        new ApiResponse(
          200,
          result,
          "Password changed successfully"
        )
      );

    }
  );
  // ==========================================
// Create Admin
// ==========================================

const createAdmin = asyncHandler(
  async (req, res) => {

    const admin =
      await adminService.createAdmin(

        req.user._id,

        req.body

      );

    return res.status(201).json(
      new ApiResponse(
        201,
        admin,
        "Admin created successfully"
      )
    );

  }
);

// ==========================================
// Update Admin
// ==========================================

const updateAdmin = asyncHandler(
  async (req, res) => {

    const admin =
      await adminService.updateAdmin(

        req.user._id,

        req.params.id,

        req.body

      );

    return res.status(200).json(
      new ApiResponse(
        200,
        admin,
        "Admin updated successfully"
      )
    );

  }
);

// ==========================================
// Delete Admin
// ==========================================

const deleteAdmin = asyncHandler(
  async (req, res) => {

    const result =
      await adminService.deleteAdmin(

        req.user._id,

        req.params.id

      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Admin deleted successfully"
      )
    );

  }
);

// ==========================================
// Get My Profile
// ==========================================

const getAdminProfile = asyncHandler(
  async (req, res) => {

    const admin =
      await adminService.getAdminProfile(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        admin,
        "Profile fetched successfully"
      )
    );

  }
);

// ==========================================
// Get All Admins
// ==========================================

const getAllAdmins = asyncHandler(
  async (req, res) => {

    const admins =
      await adminService.getAllAdmins(
        req.query
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        admins,
        "Admins fetched successfully"
      )
    );

  }
);

// ==========================================
// Get Admin By ID
// ==========================================

const getAdminById = asyncHandler(
  async (req, res) => {

    const admin =
      await adminService.getAdminById(
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        admin,
        "Admin fetched successfully"
      )
    );

  }
);
// ==========================================
// Update Admin Role
// ==========================================

const updateRole = asyncHandler(
  async (req, res) => {

    const admin =
      await adminService.updateRole(

        req.user._id,

        req.params.id,

        req.body.role

      );

    return res.status(200).json(
      new ApiResponse(
        200,
        admin,
        "Admin role updated successfully"
      )
    );

  }
);

// ==========================================
// Update Admin Permissions
// ==========================================

const updatePermissions =
  asyncHandler(
    async (req, res) => {

      const admin =
        await adminService.updatePermissions(

          req.user._id,

          req.params.id,

          req.body.permissions

        );

      return res.status(200).json(
        new ApiResponse(
          200,
          admin,
          "Admin permissions updated successfully"
        )
      );

    }
  );

// ==========================================
// Toggle Admin Status
// ==========================================

const toggleAdminStatus =
  asyncHandler(
    async (req, res) => {

      const admin =
        await adminService.toggleAdminStatus(

          req.user._id,

          req.params.id,

          req.body.isActive

        );

      return res.status(200).json(
        new ApiResponse(
          200,
          admin,
          "Admin status updated successfully"
        )
      );

    }
  );

// ==========================================
// Get All Users
// ==========================================

const getAllUsers =
  asyncHandler(
    async (req, res) => {

      const users =
        await adminService.getAllUsers(
          req.query
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          users,
          "Users fetched successfully"
        )
      );

    }
  );

// ==========================================
// Block User
// ==========================================

const blockUser =
  asyncHandler(
    async (req, res) => {

      const result =
        await adminService.blockUser(

          req.user._id,

          req.params.userId

        );

      return res.status(200).json(
        new ApiResponse(
          200,
          result,
          "User blocked successfully"
        )
      );

    }
  );

// ==========================================
// Unblock User
// ==========================================

const unblockUser =
  asyncHandler(
    async (req, res) => {

      const result =
        await adminService.unblockUser(

          req.user._id,

          req.params.userId

        );

      return res.status(200).json(
        new ApiResponse(
          200,
          result,
          "User unblocked successfully"
        )
      );

    }
  );
  // ==========================================
// Approve Owner
// ==========================================

const approveOwner = asyncHandler(
  async (req, res) => {

    const owner =
      await adminService.approveOwner(

        req.user._id,

        req.params.ownerId

      );

    return res.status(200).json(
      new ApiResponse(
        200,
        owner,
        "Owner approved successfully"
      )
    );

  }
);

// ==========================================
// Reject Owner
// ==========================================

const rejectOwner = asyncHandler(
  async (req, res) => {

    const owner =
      await adminService.rejectOwner(

        req.user._id,

        req.params.ownerId,

        req.body.reason

      );

    return res.status(200).json(
      new ApiResponse(
        200,
        owner,
        "Owner rejected successfully"
      )
    );

  }
);

// ==========================================
// Approve Turf
// ==========================================

const approveTurf = asyncHandler(
  async (req, res) => {

    const turf =
      await adminService.approveTurf(

        req.user._id,

        req.params.turfId

      );

    return res.status(200).json(
      new ApiResponse(
        200,
        turf,
        "Turf approved successfully"
      )
    );

  }
);

// ==========================================
// Reject Turf
// ==========================================

const rejectTurf = asyncHandler(
  async (req, res) => {

    const turf =
      await adminService.rejectTurf(

        req.user._id,

        req.params.turfId,

        req.body.reason

      );

    return res.status(200).json(
      new ApiResponse(
        200,
        turf,
        "Turf rejected successfully"
      )
    );

  }
);

// ==========================================
// Dashboard Statistics
// ==========================================

const getDashboardStatistics =
  asyncHandler(
    async (req, res) => {

      const statistics =
        await adminService.getDashboardStatistics();

      return res.status(200).json(
        new ApiResponse(
          200,
          statistics,
          "Dashboard statistics fetched successfully"
        )
      );

    }
  );

// ==========================================
// Revenue Analytics
// ==========================================

const getRevenueAnalytics =
  asyncHandler(
    async (req, res) => {

      const analytics =
        await adminService.getRevenueAnalytics();

      return res.status(200).json(
        new ApiResponse(
          200,
          analytics,
          "Revenue analytics fetched successfully"
        )
      );

    }
  );

// ==========================================
// Platform Analytics
// ==========================================

const getPlatformAnalytics =
  asyncHandler(
    async (req, res) => {

      const analytics =
        await adminService.getPlatformAnalytics();

      return res.status(200).json(
        new ApiResponse(
          200,
          analytics,
          "Platform analytics fetched successfully"
        )
      );

    }
  );

// ==========================================
// Audit Logs
// ==========================================

const getAuditLogs =
  asyncHandler(
    async (req, res) => {

      const logs =
        await adminService.getAuditLogs(
          req.query
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          logs,
          "Audit logs fetched successfully"
        )
      );

    }
  );

// ==========================================
// Recent Activities
// ==========================================

const getRecentActivities =
  asyncHandler(
    async (req, res) => {

      const activities =
        await adminService.getRecentActivities();

      return res.status(200).json(
        new ApiResponse(
          200,
          activities,
          "Recent activities fetched successfully"
        )
      );

    }
  );

// ==========================================
// System Health
// ==========================================

const getSystemHealth =
  asyncHandler(
    async (req, res) => {

      const health =
        await adminService.getSystemHealth();

      return res.status(200).json(
        new ApiResponse(
          200,
          health,
          "System health fetched successfully"
        )
      );

    }
  );

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  // Authentication
  registerAdmin,
  loginAdmin,
  refreshAccessToken,
  logoutAdmin,
  changePassword,

  // Admin Management
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminProfile,
  getAllAdmins,
  getAdminById,

  // RBAC
  updateRole,
  updatePermissions,
  toggleAdminStatus,

  // User Management
  getAllUsers,
  blockUser,
  unblockUser,

  // Owner Management
  approveOwner,
  rejectOwner,

  // Turf Management
  approveTurf,
  rejectTurf,

  // Dashboard
  getDashboardStatistics,
  getRevenueAnalytics,
  getPlatformAnalytics,

  // Monitoring
  getAuditLogs,
  getRecentActivities,
  getSystemHealth,

};