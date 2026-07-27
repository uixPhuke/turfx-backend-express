// src/modules/auth/auth.controller.js

const authService = require("./auth.service");

// ==========================================
// Register
// ==========================================

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const applyForOwner = asyncHandler(async(req,res)=>{

    const owner=await userService.applyForOwner(
        req.user._id,
        req.body
    );

    res.status(200).json(
        new ApiResponse(
            200,
            owner,
            "Owner application submitted successfully"
        )
    );

});
const getOwnerStatus = asyncHandler(async(req,res)=>{

    const status=await userService.getOwnerStatus(req.user._id);

    res.status(200).json(
        new ApiResponse(
            200,
            status,
            "Owner status fetched"
        )
    );

});

// ==========================================
// Login
// ==========================================

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Current User
// ==========================================

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Refresh Token
// ==========================================

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const token = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: token,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Logout
// ==========================================

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Forgot Password
// ==========================================

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Verify OTP
// ==========================================

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;

    const result = await authService.verifyOtp(
      email,
      otp,
      purpose
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Reset Password
// ==========================================

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const result = await authService.resetPassword(
      email,
      otp,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Change Password
// ==========================================

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const result = await authService.changePassword(
      req.user.id,
      oldPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Verify Email
// ==========================================

const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const result = await authService.verifyEmail(
      email,
      otp
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Resend Verification Email
// ==========================================

const resendVerificationEmail = async (
  req,
  res,
  next
) => {
  try {
    const { email } = req.body;

    const result =
      await authService.resendVerificationEmail(
        email
      );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,

  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,

  verifyEmail,
  resendVerificationEmail,
};