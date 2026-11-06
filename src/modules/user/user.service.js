const User = require("./user.model");
const ApiError = require("../../utils/ApiError");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../../config/cloudinary");

// ==========================================
// Get My Profile
// ==========================================

const getMyProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isDeleted) {
    throw new ApiError(404, "User account has been deleted");
  }

  return user;
};

// ==========================================
// Update Profile
// ==========================================

const updateProfile = async (userId, data) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isDeleted) {
    throw new ApiError(404, "User account has been deleted");
  }

  const {
    name,
    phone,
    gender,
    dateOfBirth,
    address,
  } = data;

  // Check phone uniqueness
  if (phone && phone !== user.phone) {
    const existingUser = await User.findOne({
      phone,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new ApiError(
        409,
        "Phone number already exists"
      );
    }

    user.phone = phone;
  }

  if (name) user.name = name;

  if (gender) user.gender = gender;

  if (dateOfBirth) {
    user.dateOfBirth = dateOfBirth;
  }

  if (address) {
    user.address = {
      ...user.address,
      ...address,
    };
  }

  await user.save();

  return user;
};

const applyForOwner = async (userId,data)=>{

    const user = await User.findById(userId);

    if(!user)
        throw new ApiError(404,"User not found");

    user.role="owner";

    user.ownerDetails={
        businessName:data.businessName,
        gstNumber:data.gstNumber,
        panNumber:data.panNumber,
        isApproved:false
    };

    await user.save();

    return user;
}

const getOwnerStatus = async(userId)=>{

    const user = await User.findById(userId);

    if(!user)
        throw new ApiError(404,"User not found");

    return {
        role:user.role,
        approved:user.ownerDetails.isApproved,
        ownerDetails:user.ownerDetails
    };
}
// ==========================================
// Update Avatar
// ==========================================

const updateAvatar = async (userId, file) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!file) {
    throw new ApiError(400, "Avatar image is required");
  }

  // Delete old avatar
  if (user.avatar && user.avatar.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  // Upload new avatar
  const uploaded = await uploadToCloudinary(
    file.buffer,
    "turfx/avatars"
  );

  user.avatar = {
    public_id: uploaded.public_id,
    url: uploaded.secure_url,
  };

  await user.save();

  return user;
};

// ==========================================
// Delete Account (Soft Delete)
// ==========================================

const deleteAccount = async (userId, password) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (!(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid password");
  }

  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  user.isDeleted = true;
  user.tokenVersion += 1;
  user.refreshToken = null;

  await user.save();

  return {
    message: "Account deleted successfully",
  };
};

// ==========================================
// Get User By ID (Admin)
// ==========================================

const getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

// ==========================================
// Get All Users (Admin)
// ==========================================

const getAllUsers = async (
  page = 1,
  limit = 10,
  search = ""
) => {
  const skip = (page - 1) * limit;

  const query = {
    isDeleted: false,
  };

  if (search) {
    query.$or = [
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

  const users = await User.find(query)
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(Number(limit));

  const totalUsers =
    await User.countDocuments(query);

  return {
    users,
    totalUsers,
    totalPages: Math.ceil(
      totalUsers / limit
    ),
    currentPage: Number(page),
  };
};

// ==========================================
// Block User
// ==========================================

const blockUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "admin") {
    throw new ApiError(
      403,
      "Admin cannot be blocked"
    );
  }

  user.isBlocked = true;

  await user.save();

  return user;
};

// ==========================================
// Unblock User
// ==========================================

const unblockUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    throw new ApiError(404, "User not found");
  }

  user.isBlocked = false;

  await user.save();

  return user;
};
// ==========================================
// Change User Role (Admin)
// ==========================================

const changeRole = async (userId, role) => {
  const allowedRoles = ["user", "owner", "admin"];

  if (!allowedRoles.includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    throw new ApiError(404, "User not found");
  }

  user.role = role;

  if (role === "owner") {
    user.ownerDetails.isApproved = false;
  }

  await user.save();

  return user;
};

// ==========================================
// Approve Owner
// ==========================================

const approveOwner = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    throw new ApiError(404, "User not found");
  }

  if (user.role !== "owner") {
    throw new ApiError(400, "User is not an owner");
  }

  user.ownerDetails.isApproved = true;

  await user.save();

  return user;
};

// ==========================================
// Reject Owner
// ==========================================

const rejectOwner = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    throw new ApiError(404, "User not found");
  }

  if (user.role !== "owner") {
    throw new ApiError(400, "User is not an owner");
  }

  user.ownerDetails.isApproved = false;

  await user.save();

  return user;
};

// ==========================================
// Restore Deleted User
// ==========================================

const restoreDeletedUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isDeleted = false;

  await user.save();

  return user;
};

// ==========================================
// Permanently Delete User
// ==========================================

const permanentlyDeleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Delete avatar from Cloudinary
  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  await User.findByIdAndDelete(userId);

  return {
    message: "User permanently deleted",
  };
};

module.exports = {
  applyForOwner,
  getOwnerStatus,
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