// src/modules/admin/admin.service.js

const jwt = require("jsonwebtoken");

const Admin = require("./admin.model");

const ApiError = require("../../utils/ApiError");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../sockets/middleware");

// ==========================================
// Helper Functions
// ==========================================

// Generate Auth Response

const generateAuthResponse = async (
  admin
) => {

  const accessToken =
    generateAccessToken({
      id: admin._id,
      role: admin.role,
    });

  const refreshToken =
    generateRefreshToken({
      id: admin._id,
      role: admin.role,
    });

  admin.refreshToken =
    refreshToken;

  admin.lastLoginAt =
    new Date();

  admin.loginCount += 1;

  await admin.save();

  return {

    admin,

    accessToken,

    refreshToken,

  };

};

// ==========================================
// Register Admin
// ==========================================

const registerAdmin = async (
  data
) => {

  const exists =
    await Admin.findOne({

      email:
        data.email.toLowerCase(),

      isDeleted: false,

    });

  if (exists) {

    throw new ApiError(
      409,
      "Admin already exists"
    );

  }

  const admin =
    await Admin.create({

      name:
        data.name,

      email:
        data.email.toLowerCase(),

      password:
        data.password,

      role:
        data.role ||
        "admin",

      profile: {

        phone:
          data.phone,

        designation:
          data.designation,

        department:
          data.department,

      },

      createdBy:
        data.createdBy ||
        null,

    });

  return generateAuthResponse(
    admin
  );

};

// ==========================================
// Login Admin
// ==========================================

const loginAdmin = async (
  email,
  password,
  ipAddress = "",
  device = ""
) => {

  const admin =
    await Admin.findActiveByEmail(
      email.toLowerCase()
    );

  if (!admin) {

    throw new ApiError(
      401,
      "Invalid email or password"
    );

  }

  if (
    admin.isLocked
  ) {

    throw new ApiError(
      423,
      "Account is temporarily locked"
    );

  }

  const isMatch =
    await admin.comparePassword(
      password
    );

  if (!isMatch) {

    await admin.incrementLoginAttempts();

    throw new ApiError(
      401,
      "Invalid email or password"
    );

  }

  await admin.resetLoginAttempts();

  admin.lastLoginIP =
    ipAddress;

  admin.lastLoginDevice =
    device;

  return generateAuthResponse(
    admin
  );

};
// ==========================================
// Refresh Access Token
// ==========================================

const refreshAccessToken = async (
  refreshToken
) => {

  if (!refreshToken) {

    throw new ApiError(
      401,
      "Refresh token is required"
    );

  }

  let payload;

  try {

    payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

  } catch (error) {

    throw new ApiError(
      401,
      "Invalid or expired refresh token"
    );

  }

  const admin =
    await Admin.findById(
      payload.id
    ).select("+refreshToken");

  if (
    !admin ||
    admin.isDeleted
  ) {

    throw new ApiError(
      404,
      "Admin not found"
    );

  }

  if (
    admin.refreshToken !==
    refreshToken
  ) {

    throw new ApiError(
      401,
      "Invalid refresh token"
    );

  }

  const accessToken =
    generateAccessToken({

      id: admin._id,

      role: admin.role,

    });

  return {

    accessToken,

  };

};

// ==========================================
// Logout Admin
// ==========================================

const logoutAdmin = async (
  adminId
) => {

  const admin =
    await Admin.findById(
      adminId
    ).select("+refreshToken");

  if (!admin) {

    throw new ApiError(
      404,
      "Admin not found"
    );

  }

  admin.refreshToken = null;

  await admin.save();

  return {

    success: true,

    message:
      "Logged out successfully",

  };

};

// ==========================================
// Change Password
// ==========================================

const changePassword = async (
  adminId,
  currentPassword,
  newPassword
) => {

  const admin =
    await Admin.findById(
      adminId
    ).select("+password +refreshToken");

  if (!admin) {

    throw new ApiError(
      404,
      "Admin not found"
    );

  }

  const isMatch =
    await admin.comparePassword(
      currentPassword
    );

  if (!isMatch) {

    throw new ApiError(
      400,
      "Current password is incorrect"
    );

  }

  const samePassword =
    await admin.comparePassword(
      newPassword
    );

  if (samePassword) {

    throw new ApiError(
      400,
      "New password cannot be the same as the current password"
    );

  }

  admin.password =
    newPassword;

  admin.passwordChangedAt =
    new Date();

  // Invalidate existing refresh token
  admin.refreshToken = null;

  await admin.save();

  return {

    success: true,

    message:
      "Password changed successfully",

  };

};

// ==========================================
// Create Admin (Super Admin)
// ==========================================

const createAdmin = async (
  superAdminId,
  data
) => {

  const superAdmin =
    await Admin.findById(
      superAdminId
    );

  if (!superAdmin) {

    throw new ApiError(
      404,
      "Super admin not found"
    );

  }

  if (
    superAdmin.role !==
    "super_admin"
  ) {

    throw new ApiError(
      403,
      "Only super admin can create admins"
    );

  }

  const exists =
    await Admin.findOne({

      email:
        data.email.toLowerCase(),

      isDeleted: false,

    });

  if (exists) {

    throw new ApiError(
      409,
      "Admin already exists"
    );

  }

  const admin =
    await Admin.create({

      name: data.name,

      email:
        data.email.toLowerCase(),

      password:
        data.password,

      role:
        data.role || "admin",

      profile: {

        phone:
          data.phone,

        designation:
          data.designation,

        department:
          data.department,

      },

      permissions:
        data.permissions || {},

      createdBy:
        superAdminId,

    });

  return admin;

};

// ==========================================
// Update Admin
// ==========================================

const updateAdmin = async (
  adminId,
  targetAdminId,
  data
) => {

  const admin =
    await Admin.findById(
      adminId
    );

  if (!admin) {

    throw new ApiError(
      404,
      "Admin not found"
    );

  }

  const target =
    await Admin.findById(
      targetAdminId
    );

  if (
    !target ||
    target.isDeleted
  ) {

    throw new ApiError(
      404,
      "Target admin not found"
    );

  }

  // Only Super Admin OR Self

  if (

    admin.role !==
      "super_admin" &&

    admin._id.toString() !==
      target._id.toString()

  ) {

    throw new ApiError(
      403,
      "Unauthorized"
    );

  }

  const fields = [

    "name",

    "email",

    "profile",

  ];

  fields.forEach(
    (field) => {

      if (
        data[field] !==
        undefined
      ) {

        target[field] =
          data[field];

      }

    }
  );

  target.updatedBy =
    adminId;

  await target.save();

  return target;

};

// ==========================================
// Delete Admin
// ==========================================

const deleteAdmin = async (
  superAdminId,
  adminId
) => {

  const superAdmin =
    await Admin.findById(
      superAdminId
    );

  if (
    !superAdmin ||
    superAdmin.role !==
      "super_admin"
  ) {

    throw new ApiError(
      403,
      "Only super admin can delete admins"
    );

  }

  const admin =
    await Admin.findById(
      adminId
    );

  if (
    !admin ||
    admin.isDeleted
  ) {

    throw new ApiError(
      404,
      "Admin not found"
    );

  }

  if (

    admin.role ===
    "super_admin"

  ) {

    throw new ApiError(
      400,
      "Super admin cannot be deleted"
    );

  }

  admin.isDeleted = true;

  admin.isActive = false;

  admin.updatedBy =
    superAdminId;

  await admin.save();

  return {

    success: true,

    message:
      "Admin deleted successfully",

  };

};

// ==========================================
// Get Admin Profile
// ==========================================

const getAdminProfile = async (
  adminId
) => {

  const admin =
    await Admin.findOne({

      _id: adminId,

      isDeleted: false,

    });

  if (!admin) {

    throw new ApiError(
      404,
      "Admin not found"
    );

  }

  return admin;

};

// ==========================================
// Get All Admins
// ==========================================

const getAllAdmins = async (
  query = {}
) => {

  const {

    page = 1,

    limit = 10,

    search,

    role,

    isActive,

    sortBy = "createdAt",

    sortOrder = "desc",

  } = query;

  const filter = {

    isDeleted: false,

  };

  if (search) {

    filter.$or = [

      {
        name: {
          $regex: search,
          $options: "i",
        },
      },

      {
        email: {
          $regex: search,
          $options: "i",
        },
      },

    ];

  }

  if (role) {

    filter.role = role;

  }

  if (
    isActive !== undefined
  ) {

    filter.isActive =
      isActive === "true";

  }

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const admins =
    await Admin.find(filter)

      .select("-refreshToken")

      .sort({

        [sortBy]:
          sortOrder === "asc"
            ? 1
            : -1,

      })

      .skip(skip)

      .limit(Number(limit));

  const total =
    await Admin.countDocuments(
      filter
    );

  return {

    admins,

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
// Get Admin By ID
// ==========================================

const getAdminById = async (
  adminId
) => {

  const admin =
    await Admin.findOne({

      _id: adminId,

      isDeleted: false,

    }).select(
      "-refreshToken"
    );

  if (!admin) {

    throw new ApiError(
      404,
      "Admin not found"
    );

  }

  return admin;

};

// ==========================================
// Update Admin Role
// ==========================================

const updateRole = async (
  superAdminId,
  adminId,
  role
) => {

  const superAdmin =
    await Admin.findById(
      superAdminId
    );

  if (
    !superAdmin ||
    superAdmin.role !== "super_admin"
  ) {

    throw new ApiError(
      403,
      "Only super admin can update roles"
    );

  }

  const admin =
    await Admin.findOne({

      _id: adminId,

      isDeleted: false,

    });

  if (!admin) {

    throw new ApiError(
      404,
      "Admin not found"
    );

  }

  if (
    admin.role === "super_admin"
  ) {

    throw new ApiError(
      400,
      "Super admin role cannot be changed"
    );

  }

  admin.role = role;

  admin.updatedBy =
    superAdminId;

  await admin.save();

  return admin;

};

// ==========================================
// Update Permissions
// ==========================================

const updatePermissions = async (
  superAdminId,
  adminId,
  permissions
) => {

  const superAdmin =
    await Admin.findById(
      superAdminId
    );

  if (
    !superAdmin ||
    superAdmin.role !== "super_admin"
  ) {

    throw new ApiError(
      403,
      "Only super admin can update permissions"
    );

  }

  const admin =
    await Admin.findOne({

      _id: adminId,

      isDeleted: false,

    });

  if (!admin) {

    throw new ApiError(
      404,
      "Admin not found"
    );

  }

  admin.permissions = {

    ...admin.permissions,

    ...permissions,

  };

  admin.updatedBy =
    superAdminId;

  await admin.save();

  return admin;

};

// ==========================================
// Toggle Admin Status
// ==========================================

const toggleAdminStatus = async (
  superAdminId,
  adminId,
  isActive
) => {

  const superAdmin =
    await Admin.findById(
      superAdminId
    );

  if (
    !superAdmin ||
    superAdmin.role !== "super_admin"
  ) {

    throw new ApiError(
      403,
      "Only super admin can change admin status"
    );

  }

  const admin =
    await Admin.findOne({

      _id: adminId,

      isDeleted: false,

    });

  if (!admin) {

    throw new ApiError(
      404,
      "Admin not found"
    );

  }

  if (
    admin.role === "super_admin"
  ) {

    throw new ApiError(
      400,
      "Super admin status cannot be changed"
    );

  }

  admin.isActive =
    isActive;

  admin.updatedBy =
    superAdminId;

  await admin.save();

  return admin;

};

// ==========================================
// Get All Users
// ==========================================

const User = require("../user/user.model");

const getAllUsers = async (
  query = {}
) => {

  const {

    page = 1,

    limit = 10,

    search,

    status,

    sortBy = "createdAt",

    sortOrder = "desc",

  } = query;

  const filter = {};

  if (search) {

    filter.$or = [

      {
        name: {
          $regex: search,
          $options: "i",
        },
      },

      {
        email: {
          $regex: search,
          $options: "i",
        },
      },

      {
        phone: {
          $regex: search,
          $options: "i",
        },
      },

    ];

  }

  if (
    status !== undefined
  ) {

    filter.isBlocked =
      status === "blocked";

  }

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const users =
    await User.find(filter)

      .select("-password -refreshToken")

      .sort({

        [sortBy]:
          sortOrder === "asc"
            ? 1
            : -1,

      })

      .skip(skip)

      .limit(Number(limit));

  const total =
    await User.countDocuments(
      filter
    );

  return {

    users,

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
// Block User
// ==========================================

const blockUser = async (
  adminId,
  userId
) => {

  const admin =
    await Admin.findById(
      adminId
    );

  if (
    !admin ||
    !admin.hasPermission(
      "users",
      "update"
    )
  ) {

    throw new ApiError(
      403,
      "You don't have permission to block users"
    );

  }

  const user =
    await User.findById(
      userId
    );

  if (!user) {

    throw new ApiError(
      404,
      "User not found"
    );

  }

  if (user.isBlocked) {

    throw new ApiError(
      400,
      "User is already blocked"
    );

  }

  user.isBlocked = true;

  user.updatedBy = adminId;

  await user.save();

  return {

    success: true,

    message:
      "User blocked successfully",

    user,

  };

};

// ==========================================
// Unblock User
// ==========================================

const unblockUser = async (
  adminId,
  userId
) => {

  const admin =
    await Admin.findById(
      adminId
    );

  if (
    !admin ||
    !admin.hasPermission(
      "users",
      "update"
    )
  ) {

    throw new ApiError(
      403,
      "You don't have permission to unblock users"
    );

  }

  const user =
    await User.findById(
      userId
    );

  if (!user) {

    throw new ApiError(
      404,
      "User not found"
    );

  }

  if (!user.isBlocked) {

    throw new ApiError(
      400,
      "User is already active"
    );

  }

  user.isBlocked = false;

  user.updatedBy = adminId;

  await user.save();

  return {

    success: true,

    message:
      "User unblocked successfully",

    user,

  };

};

// ==========================================
// Imports
// ==========================================

//const Owner = require("../owner/owner.model");
const Turf = require("../turf/turf.model");
const Notification = require("../notification/notification.model");

// ==========================================
// Approve Owner
// ==========================================

const approveOwner = async (
  adminId,
  ownerId
) => {

  const admin = await Admin.findById(adminId);

  if (
    !admin ||
    !admin.hasPermission("owners", "update")
  ) {
    throw new ApiError(
      403,
      "You don't have permission to approve owners"
    );
  }

  const owner = await Owner.findById(ownerId);

  if (!owner) {
    throw new ApiError(
      404,
      "Owner not found"
    );
  }

  if (owner.status === "approved") {
    throw new ApiError(
      400,
      "Owner is already approved"
    );
  }

  owner.status = "approved";
  owner.isVerified = true;
  owner.approvedBy = adminId;
  owner.approvedAt = new Date();

  await owner.save();

  await Notification.create({

    user: owner.user,

    title: "Owner Account Approved",

    message:
      "Congratulations! Your owner account has been approved.",

    type: "owner_approved",

  });

  return owner;

};

// ==========================================
// Reject Owner
// ==========================================

const rejectOwner = async (
  adminId,
  ownerId,
  reason = ""
) => {

  const admin = await Admin.findById(adminId);

  if (
    !admin ||
    !admin.hasPermission("owners", "update")
  ) {
    throw new ApiError(
      403,
      "You don't have permission to reject owners"
    );
  }

  const owner = await Owner.findById(ownerId);

  if (!owner) {
    throw new ApiError(
      404,
      "Owner not found"
    );
  }

  owner.status = "rejected";
  owner.rejectionReason = reason;
  owner.approvedBy = adminId;
  owner.approvedAt = new Date();

  await owner.save();

  await Notification.create({

    user: owner.user,

    title: "Owner Application Rejected",

    message:
      reason ||
      "Your owner application has been rejected.",

    type: "owner_rejected",

  });

  return owner;

};

// ==========================================
// Approve Turf
// ==========================================

const approveTurf = async (
  adminId,
  turfId
) => {

  const admin = await Admin.findById(adminId);

  if (
    !admin ||
    !admin.hasPermission("turfs", "update")
  ) {
    throw new ApiError(
      403,
      "You don't have permission to approve turfs"
    );
  }

  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new ApiError(
      404,
      "Turf not found"
    );
  }

  turf.status = "approved";
  turf.isApproved = true;
  turf.approvedBy = adminId;
  turf.approvedAt = new Date();

  await turf.save();

  await Notification.create({

    user: turf.owner,

    title: "Turf Approved",

    message:
      `${turf.name} has been approved and is now live.`,

    type: "turf_approved",

  });

  return turf;

};

// ==========================================
// Reject Turf
// ==========================================

const rejectTurf = async (
  adminId,
  turfId,
  reason = ""
) => {

  const admin = await Admin.findById(adminId);

  if (
    !admin ||
    !admin.hasPermission("turfs", "update")
  ) {
    throw new ApiError(
      403,
      "You don't have permission to reject turfs"
    );
  }

  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new ApiError(
      404,
      "Turf not found"
    );
  }

  turf.status = "rejected";
  turf.isApproved = false;
  turf.rejectionReason = reason;
  turf.approvedBy = adminId;
  turf.approvedAt = new Date();

  await turf.save();

  await Notification.create({

    user: turf.owner,

    title: "Turf Rejected",

    message:
      reason ||
      `${turf.name} has been rejected.`,

    type: "turf_rejected",

  });

  return turf;

};

// ==========================================
// Imports
// ==========================================

const Booking = require("../booking/booking.model");
const Payment = require("../payment/payment.model");
const Wallet = require("../wallet/wallet.model");
const Coupon = require("../coupon/coupon.model");
const Review = require("../review/review.model");

// ==========================================
// Dashboard Statistics
// ==========================================

const getDashboardStatistics = async () => {

  const [

    totalUsers,

    totalOwners,

    totalTurfs,

    totalBookings,

    totalPayments,

    totalCoupons,

    totalReviews,

    totalWallets,

  ] = await Promise.all([

    User.countDocuments({
      isDeleted: false,
    }),

    Owner.countDocuments({
      isDeleted: false,
    }),

    Turf.countDocuments({
      isDeleted: false,
    }),

    Booking.countDocuments({
      isDeleted: false,
    }),

    Payment.countDocuments({
      isDeleted: false,
    }),

    Coupon.countDocuments({
      isDeleted: false,
    }),

    Review.countDocuments({
      isDeleted: false,
    }),

    Wallet.countDocuments({
      isDeleted: false,
    }),

  ]);

  return {

    totalUsers,

    totalOwners,

    totalTurfs,

    totalBookings,

    totalPayments,

    totalCoupons,

    totalReviews,

    totalWallets,

  };

};

// ==========================================
// Revenue Analytics
// ==========================================

const getRevenueAnalytics = async () => {

  const revenue =
    await Payment.aggregate([

      {
        $match: {

          paymentStatus: "success",

          isDeleted: false,

        },
      },

      {
        $group: {

          _id: null,

          totalRevenue: {
            $sum: "$amount",
          },

          averagePayment: {
            $avg: "$amount",
          },

          totalTransactions: {
            $sum: 1,
          },

        },
      },

    ]);

  return revenue[0] || {

    totalRevenue: 0,

    averagePayment: 0,

    totalTransactions: 0,

  };

};

// ==========================================
// Platform Analytics
// ==========================================

const getPlatformAnalytics = async () => {

  const [

    bookingStatus,

    paymentMethods,

    topRatedTurfs,

  ] = await Promise.all([

    Booking.aggregate([

      {
        $group: {

          _id: "$status",

          count: {
            $sum: 1,
          },

        },
      },

    ]),

    Payment.aggregate([

      {
        $group: {

          _id: "$paymentMethod",

          count: {
            $sum: 1,
          },

        },
      },

    ]),

    Turf.find({

      isDeleted: false,

    })

      .sort({

        averageRating: -1,

      })

      .limit(10)

      .select(
        "name averageRating totalReviews"
      ),

  ]);

  return {

    bookingStatus,

    paymentMethods,

    topRatedTurfs,

  };

};

// ==========================================
// Imports
// ==========================================

const os = require("os");
const mongoose = require("mongoose");

// ==========================================
// Get Audit Logs
// ==========================================

const getAuditLogs = async (
  query = {}
) => {

  const {

    page = 1,

    limit = 20,

  } = query;

  const admins =
    await Admin.find({

      isDeleted: false,

    })
      .select(
        "name role updatedAt createdAt updatedBy createdBy"
      )
      .populate(
        "updatedBy",
        "name email"
      )
      .populate(
        "createdBy",
        "name email"
      )
      .sort({
        updatedAt: -1,
      })
      .skip(
        (page - 1) * limit
      )
      .limit(
        Number(limit)
      );

  const total =
    await Admin.countDocuments({

      isDeleted: false,

    });

  return {

    logs: admins,

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
// Get Recent Activities
// ==========================================

const getRecentActivities =
  async () => {

    const [

      bookings,

      payments,

      reviews,

      users,

    ] = await Promise.all([

      Booking.find()
        .sort({
          createdAt: -1,
        })
        .limit(5),

      Payment.find()
        .sort({
          createdAt: -1,
        })
        .limit(5),

      Review.find()
        .sort({
          createdAt: -1,
        })
        .limit(5),

      User.find()
        .sort({
          createdAt: -1,
        })
        .limit(5),

    ]);

    return {

      recentBookings:
        bookings,

      recentPayments:
        payments,

      recentReviews:
        reviews,

      newUsers:
        users,

    };

};

// ==========================================
// Get System Health
// ==========================================

const getSystemHealth =
  async () => {

    const dbStatus =
      mongoose.connection.readyState;

    const database =

      dbStatus === 1
        ? "Connected"
        : "Disconnected";

    const uptime =
      process.uptime();

    const memory =
      process.memoryUsage();

    const cpuCount =
      os.cpus().length;

    const loadAverage =
      os.loadavg();

    return {

      status: "healthy",

      database,

      uptime,

      platform:
        process.platform,

      nodeVersion:
        process.version,

      cpuCount,

      loadAverage,

      memory: {

        rss:
          memory.rss,

        heapUsed:
          memory.heapUsed,

        heapTotal:
          memory.heapTotal,

        external:
          memory.external,

      },

      timestamp:
        new Date(),

    };

};

// ==========================================
// Helper Functions
// ==========================================

// Check Permission
const checkPermission = async (
  adminId,
  module,
  action
) => {

  const admin = await Admin.findById(adminId);

  if (!admin) {

    throw new ApiError(
      404,
      "Admin not found"
    );

  }

  if (
    !admin.hasPermission(
      module,
      action
    )
  ) {

    throw new ApiError(
      403,
      "Permission denied"
    );

  }

  return admin;

};

// Get Admin Or Throw
const getAdminOrThrow = async (
  adminId
) => {

  const admin =
    await Admin.findOne({

      _id: adminId,

      isDeleted: false,

    });

  if (!admin) {

    throw new ApiError(
      404,
      "Admin not found"
    );

  }

  return admin;

};

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  // ===========================
  // Authentication
  // ===========================

  registerAdmin,

  loginAdmin,

  refreshAccessToken,

  logoutAdmin,

  changePassword,

  // ===========================
  // Admin Management
  // ===========================

  createAdmin,

  updateAdmin,

  deleteAdmin,

  getAdminProfile,

  getAllAdmins,

  getAdminById,

  updateRole,

  updatePermissions,

  toggleAdminStatus,

  // ===========================
  // User Management
  // ===========================

  getAllUsers,

  blockUser,

  unblockUser,

  // ===========================
  // Owner Management
  // ===========================

  approveOwner,

  rejectOwner,

  // ===========================
  // Turf Management
  // ===========================

  approveTurf,

  rejectTurf,

  // ===========================
  // Dashboard
  // ===========================

  getDashboardStatistics,

  getRevenueAnalytics,

  getPlatformAnalytics,

  // ===========================
  // Monitoring
  // ===========================

  getAuditLogs,

  getRecentActivities,

  getSystemHealth,

  // ===========================
  // Helpers
  // ===========================

  checkPermission,

  getAdminOrThrow,

};