const express = require("express");

const router = express.Router();

const userController = require("./user.controller");

const {
  updateProfileValidation,
  updateAvatarValidation,
  deleteAccountValidation,
  userIdValidation,
  changeRoleValidation,
  blockUserValidation,
  unblockUserValidation,
  approveOwnerValidation,
  rejectOwnerValidation,
  restoreUserValidation,
  permanentDeleteValidation,
} = require("./user.validation");

const authMiddleware = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validation.middleware");
const upload = require("../../middlewares/upload.middleware");

// ==========================================
// User Routes
// ==========================================

// Get My Profile
router.get(
  "/profile",
  authMiddleware,
  userController.getMyProfile
);

// Update Profile
router.patch(
  "/update-profile",
  authMiddleware,
  updateProfileValidation,
  validate,
  userController.updateProfile
);

// Update Avatar
router.patch(
  "/update-avatar",
  authMiddleware,
  upload.single("avatar"),
  updateAvatarValidation,
  validate,
  userController.updateAvatar
);

// Delete Account
router.delete(
  "/delete-account",
  authMiddleware,
  deleteAccountValidation,
  validate,
  userController.deleteAccount
);

// ==========================================
// Admin Routes
// ==========================================

// Get All Users
router.get(
  "/all",
  authMiddleware,
  authorize("admin"),
  userController.getAllUsers
);

// Get User By ID
router.get(
  "/:id",
  authMiddleware,
  authorize("admin"),
  userIdValidation,
  validate,
  userController.getUserById
);

// Block User
router.patch(
  "/block/:id",
  authMiddleware,
  authorize("admin"),
  blockUserValidation,
  validate,
  userController.blockUser
);

// Unblock User
router.patch(
  "/unblock/:id",
  authMiddleware,
  authorize("admin"),
  unblockUserValidation,
  validate,
  userController.unblockUser
);

// Change Role
router.patch(
  "/role/:id",
  authMiddleware,
  authorize("admin"),
  changeRoleValidation,
  validate,
  userController.changeRole
);

// Approve Owner
router.patch(
  "/approve-owner/:id",
  authMiddleware,
  authorize("admin"),
  approveOwnerValidation,
  validate,
  userController.approveOwner
);

// Reject Owner
router.patch(
  "/reject-owner/:id",
  authMiddleware,
  authorize("admin"),
  rejectOwnerValidation,
  validate,
  userController.rejectOwner
);

// Restore Deleted User
router.patch(
  "/restore/:id",
  authMiddleware,
  authorize("admin"),
  restoreUserValidation,
  validate,
  userController.restoreDeletedUser
);

// Permanently Delete User
router.delete(
  "/permanent-delete/:id",
  authMiddleware,
  authorize("admin"),
  permanentDeleteValidation,
  validate,
  userController.permanentlyDeleteUser
);

module.exports = router;