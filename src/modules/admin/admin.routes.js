const express = require("express");

const router = express.Router();

const adminController = require("./admin.controller");

const {
  registerAdminValidation,
  loginAdminValidation,
  createAdminValidation,
  updateAdminValidation,
  changePasswordValidation,
  updateRoleValidation,
  updatePermissionsValidation,
  toggleStatusValidation,
  adminIdValidation,
  searchAdminValidation,
  paginationValidation,
} = require("./admin.validation");

const auth = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validation.middleware");

const {
  authLimiter,
  passwordLimiter,
  adminLimiter,
} = require("../../middlewares/rateLimiter");

// ======================================================
// Authentication
// ======================================================

// Login
router.post(
  "/login",
  authLimiter,
  loginAdminValidation,
  validate,
  adminController.loginAdmin
);

// Register (Super Admin Only)
router.post(
  "/register",
  auth,
  authorize("super_admin"),
  adminLimiter,
  registerAdminValidation,
  validate,
  adminController.registerAdmin
);

// Refresh Token
router.post(
  "/refresh-token",
  authLimiter,
  adminController.refreshAccessToken
);

// Logout
router.post(
  "/logout",
  auth,
  authorize("admin", "super_admin"),
  authLimiter,
  adminController.logoutAdmin
);

// Change Password
router.patch(
  "/change-password",
  auth,
  authorize("admin", "super_admin"),
  passwordLimiter,
  changePasswordValidation,
  validate,
  adminController.changePassword
);

// ======================================================
// Protected Admin Routes
// ======================================================

router.use(auth);
router.use(authorize("admin", "super_admin"));
router.use(adminLimiter);

// ======================================================
// Profile
// ======================================================

router.get(
  "/profile",
  adminController.getAdminProfile
);

// ======================================================
// Admin Management (Super Admin)
// ======================================================

router.post(
  "/",
  authorize("super_admin"),
  createAdminValidation,
  validate,
  adminController.createAdmin
);

router.get(
  "/",
  authorize("super_admin"),
  searchAdminValidation,
  paginationValidation,
  validate,
  adminController.getAllAdmins
);

router.get(
  "/:id",
  authorize("super_admin"),
  adminIdValidation,
  validate,
  adminController.getAdminById
);

router.patch(
  "/:id",
  authorize("super_admin"),
  adminIdValidation,
  updateAdminValidation,
  validate,
  adminController.updateAdmin
);

router.delete(
  "/:id",
  authorize("super_admin"),
  adminIdValidation,
  validate,
  adminController.deleteAdmin
);

// ======================================================
// RBAC
// ======================================================

router.patch(
  "/:id/role",
  authorize("super_admin"),
  adminIdValidation,
  updateRoleValidation,
  validate,
  adminController.updateRole
);

router.patch(
  "/:id/permissions",
  authorize("super_admin"),
  adminIdValidation,
  updatePermissionsValidation,
  validate,
  adminController.updatePermissions
);

router.patch(
  "/:id/status",
  authorize("super_admin"),
  adminIdValidation,
  toggleStatusValidation,
  validate,
  adminController.toggleAdminStatus
);

// ======================================================
// User Management
// ======================================================

router.get(
  "/users/all",
  adminController.getAllUsers
);

router.patch(
  "/users/:userId/block",
  adminController.blockUser
);

router.patch(
  "/users/:userId/unblock",
  adminController.unblockUser
);

// ======================================================
// Owner Management
// ======================================================

router.patch(
  "/owners/:ownerId/approve",
  adminController.approveOwner
);

router.patch(
  "/owners/:ownerId/reject",
  adminController.rejectOwner
);

// ======================================================
// Turf Management
// ======================================================

router.patch(
  "/turfs/:turfId/approve",
  adminController.approveTurf
);

router.patch(
  "/turfs/:turfId/reject",
  adminController.rejectTurf
);

// ======================================================
// Dashboard
// ======================================================

router.get(
  "/dashboard/statistics",
  adminController.getDashboardStatistics
);

router.get(
  "/dashboard/revenue",
  adminController.getRevenueAnalytics
);

router.get(
  "/dashboard/platform",
  adminController.getPlatformAnalytics
);

// ======================================================
// Monitoring
// ======================================================

router.get(
  "/activities",
  adminController.getRecentActivities
);

// ======================================================
// Super Admin Monitoring
// ======================================================

router.get(
  "/audit-logs",
  authorize("super_admin"),
  adminController.getAuditLogs
);

router.get(
  "/system-health",
  authorize("super_admin"),
  adminController.getSystemHealth
);

module.exports = router;