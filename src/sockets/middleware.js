// src/socket/middleware.js

const jwt = require("jsonwebtoken");

const User = require("../modules/user/user.model");
//const Owner = require("../modules/owner/owner.model");
const Admin = require("../modules/admin/admin.model");

// ==========================================
// Socket Authentication Middleware
// ==========================================

const socketAuth = async (
  socket,
  next
) => {

  try {

    // ======================================
    // Get Token
    // ======================================

    const token =

      socket.handshake.auth?.token ||

      socket.handshake.headers?.authorization?.replace(
        "Bearer ",
        ""
      );

    if (!token) {

      return next(
        new Error("Authentication required")
      );

    }

    // ======================================
    // Verify JWT
    // ======================================

    const decoded = jwt.verify(

      token,

      process.env.ACCESS_TOKEN_SECRET

    );

    let account = null;

    // ======================================
    // Find User
    // ======================================

    if (decoded.role === "user") {

      account = await User.findById(
        decoded._id
      ).select("-password -refreshToken");

    }

    // ======================================
    // Find Owner
    // ======================================

    else if (
      decoded.role === "owner"
    ) {

      account = await Owner.findById(
        decoded._id
      ).select("-password -refreshToken");

    }

    // ======================================
    // Find Admin
    // ======================================

    else if (
      decoded.role === "admin" ||

      decoded.role === "super_admin"
    ) {

      account = await Admin.findById(
        decoded._id
      ).select("-password -refreshToken");

    }

    if (!account) {

      return next(
        new Error("Invalid token")
      );

    }

    if (
      account.isBlocked ||
      account.isDeleted === true
    ) {

      return next(
        new Error("Account unavailable")
      );

    }

    // ======================================
    // Attach User
    // ======================================

    socket.user = {

      _id: account._id,

      role: decoded.role,

      name: account.name,

      email: account.email,

    };

    next();

  } catch (error) {

    next(
      new Error("Unauthorized")
    );

  }

};

module.exports = socketAuth;