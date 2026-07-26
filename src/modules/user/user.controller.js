const userService = require("./user.service");

const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../middlewares/async.middleware");

// ==========================================
// Get My Profile
// ==========================================

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getMyProfile(req.user._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      "Profile fetched successfully"
    )
  );
});

// ==========================================
// Update Profile
// ==========================================

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(
    req.user._id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      "Profile updated successfully"
    )
  );
});

// ==========================================
// Update Avatar
// ==========================================

const updateAvatar = asyncHandler(async (req, res) => {
  const user = await userService.updateAvatar(
    req.user._id,
    req.file
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      "Avatar updated successfully"
    )
  );
});

// ==========================================
// Delete Account
// ==========================================

const deleteAccount = asyncHandler(async (req, res) => {
  const result = await userService.deleteAccount(
    req.user._id,
    req.body.password
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Account deleted successfully"
    )
  );
});

// ==========================================
// Get User By ID (Admin)
// ==========================================

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      "User fetched successfully"
    )
  );
});

// ==========================================
// Get All Users (Admin)
// ==========================================

const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
  } = req.query;

  const users = await userService.getAllUsers(
    page,
    limit,
    search
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      users,
      "Users fetched successfully"
    )
  );
});

// ==========================================
// Block User
// ==========================================

const blockUser = asyncHandler(async (req, res) => {
  const user = await userService.blockUser(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      "User blocked successfully"
    )
  );
});

// ==========================================
// Unblock User
// ==========================================

const unblockUser = asyncHandler(async (req, res) => {
  const user = await userService.unblockUser(req.params.id);

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      "User unblocked successfully"
    )
  );
});

// ==========================================
// Change User Role
// ==========================================

const changeRole = asyncHandler(async (req, res) => {
  const user = await userService.changeRole(
    req.params.id,
    req.body.role
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      "Role updated successfully"
    )
  );
});

// ==========================================
// Approve Owner
// ==========================================

const approveOwner = asyncHandler(async (req, res) => {
  const owner = await userService.approveOwner(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      owner,
      "Owner approved successfully"
    )
  );
});

// ==========================================
// Reject Owner
// ==========================================

const rejectOwner = asyncHandler(async (req, res) => {
  const owner = await userService.rejectOwner(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      owner,
      "Owner rejected successfully"
    )
  );
});

// ==========================================
// Restore Deleted User
// ==========================================

const restoreDeletedUser = asyncHandler(async (req, res) => {
  const user = await userService.restoreDeletedUser(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      "User restored successfully"
    )
  );
});

// ==========================================
// Permanently Delete User
// ==========================================

const permanentlyDeleteUser = asyncHandler(async (req, res) => {
  const result =
    await userService.permanentlyDeleteUser(
      req.params.id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "User permanently deleted"
    )
  );
});

module.exports = {
  // User
  getMyProfile,
  updateProfile,
  updateAvatar,
  deleteAccount,

  // Admin
  getUserById,
  getAllUsers,
  blockUser,
  unblockUser,
  changeRole,
  approveOwner,
  rejectOwner,
  restoreDeletedUser,
  permanentlyDeleteUser,
};