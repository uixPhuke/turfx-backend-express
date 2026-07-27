const jwt = require("jsonwebtoken");
const User = require("../user/user.model");
const Otp = require("./otp.model");
const ApiError = require("../../utils/ApiError");

const { sendEmail } = require("../../utils/sendEmail");
const { generateOTP, getOTPExpiry } = require("../../utils/generateOTP");

// ==========================================
// Generate Access Token
// ==========================================
// console.log({
//   JWT_SECRET: process.env.JWT_SECRET,
//   JWT_EXPIRE: process.env.JWT_EXPIRE,
//   REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
//   REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE,
// });
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/generateToken");




// ==========================================
// Register
// ==========================================

const register = async (data) => {
  const {
    name,
    email,
    phone,
    password,
  } = data;

  const existingUser = await User.findOne({
    $or: [
      { email },
      { phone },
    ],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create({
  name,
  email,
  phone,
  password,
});

// Generate Tokens
const accessToken = generateAccessToken({
  id: user._id,
  role: user.role,
});

const refreshToken = generateRefreshToken({
  id: user._id,
});

// Save refresh token
user.refreshToken = refreshToken;
await user.save();

  // Delete previous OTP
  await Otp.deleteMany({
    email,
    purpose: "EMAIL_VERIFICATION",
  });

  // Generate OTP
  const otp = generateOTP();

  await Otp.create({
    user: user._id,
    email,
    otp,
    purpose: "EMAIL_VERIFICATION",
    expiresAt: getOTPExpiry(),
  });

  // Send Email
  await sendEmail({
    to: email,
    subject: "Verify your TurfX account",
    html: `
      <h2>Welcome to TurfX</h2>

      <p>Your verification OTP is</p>

      <h1>${otp}</h1>

      <p>This OTP will expire in 10 minutes.</p>
    `,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

// ==========================================
// Login
// ==========================================

const login = async (
  email,
  password
) => {
  const user = await User.findOne({
    email,
  }).select("+password +refreshToken");



 
if (!user) {
  throw new ApiError(401, "Invalid email or password");
}

if (user.isBlocked) {
  throw new ApiError(403, "Your account has been blocked");
}


  const isMatch =
    await user.comparePassword(
      password
    );

  if (!isMatch) {
  throw new ApiError(401, "Invalid email or password");
}
  user.lastLogin = new Date();

  const accessToken = generateAccessToken({
  id: user._id,
  role: user.role,
});

const refreshToken = generateRefreshToken({
  id: user._id,
});

  user.refreshToken =
    refreshToken;

  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
  };
};

// ==========================================
// Get Current User
// ==========================================

const getCurrentUser =
  async (userId) => {
    const user =
      await User.findById(userId);

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    return user;
  };

// ==========================================
// Refresh Token
// ==========================================

const refreshAccessToken =
  async (refreshToken) => {
    if (!refreshToken) {
      throw new Error(
        "Refresh token is required"
      );
    }

    const decoded =
      jwt.verify(
        refreshToken,
        process.env
          .REFRESH_TOKEN_SECRET
      );

    const user =
      await User.findById(
        decoded.id
      ).select("+refreshToken");

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    if (
      user.refreshToken !==
      refreshToken
    ) {
      throw new Error(
        "Invalid refresh token"
      );
    }

    return {
  accessToken: generateAccessToken({
    id: user._id,
    role: user.role,
  }),
};
  };

// ==========================================
// Logout
// ==========================================

const logout = async (
  userId
) => {
  const user =
    await User.findById(
      userId
    ).select("+refreshToken");

  if (!user) {
    throw new Error(
      "User not found"
    );
  }

  user.refreshToken = null;

  await user.save();

  return true;
};

// ==========================================
// Forgot Password
// ==========================================

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  // Delete old OTP
  await Otp.deleteMany({
    email,
    purpose: "FORGOT_PASSWORD",
  });

  // Generate OTP
  const otp = generateOTP();

  // Save OTP
  await Otp.create({
    user: user._id,
    email,
    otp,
    purpose: "FORGOT_PASSWORD",
    expiresAt: getOTPExpiry(),
  });

  // Send Email
  await sendEmail({
    to: email,
    subject: "Reset Your TurfX Password",
    html: `
      <h2>Password Reset Request</h2>

      <p>Your OTP is:</p>

      <h1 style="letter-spacing:5px;">${otp}</h1>

      <p>This OTP is valid for <b>10 minutes</b>.</p>

      <p>If you didn't request this, please ignore this email.</p>
    `,
  });

  return {
    message: "OTP sent successfully",
  };
};

// ==========================================
// Verify OTP
// ==========================================

const verifyOtp = async (email, otp, purpose) => {
  const otpData = await Otp.findOne({
    email,
    purpose,
  });

  if (!otpData) {
    throw new Error("OTP not found");
  }

  if (otpData.expiresAt < new Date()) {
    await otpData.deleteOne();
    throw new Error("OTP has expired");
  }

  otpData.attempts += 1;

  if (otpData.attempts > 5) {
    await otpData.deleteOne();
    throw new Error("Too many invalid attempts");
  }

  if (otpData.otp !== otp) {
    await otpData.save();
    throw new Error("Invalid OTP");
  }

  otpData.verified = true;

  await otpData.save();

  return {
    message: "OTP verified successfully",
  };
};

// ==========================================
// Reset Password
// ==========================================

const resetPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("User not found");
  }

  const otpData = await Otp.findOne({
    email,
    purpose: "FORGOT_PASSWORD",
  });

  if (!otpData) {
    throw new Error("OTP not found");
  }

  if (otpData.expiresAt < new Date()) {
    await otpData.deleteOne();
    throw new Error("OTP has expired");
  }

  if (!otpData.verified) {
    throw new Error("Please verify your OTP first");
  }

  if (otpData.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  user.password = newPassword;

  await user.save();

  await otpData.deleteOne();

  return {
    message: "Password reset successfully",
  };
};

// ==========================================
// Change Password
// ==========================================

const changePassword = async (
  userId,
  oldPassword,
  newPassword
) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) {
    throw new Error("Old password is incorrect");
  }

  user.password = newPassword;

  await user.save();

  return {
    message: "Password changed successfully",
  };
};

// ==========================================
// Verify Email
// ==========================================

const verifyEmail = async (email, otp) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const otpData = await Otp.findOne({
    email,
    purpose: "EMAIL_VERIFICATION",
  });

  if (!otpData) {
    throw new Error("OTP not found");
  }

  if (otpData.expiresAt < new Date()) {
    await otpData.deleteOne();
    throw new Error("OTP has expired");
  }

  if (otpData.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  user.isVerified = true;
  await user.save();

  await otpData.deleteOne();

  return {
    message: "Email verified successfully",
  };
};

// ==========================================
// Resend Verification Email
// ==========================================

const resendVerificationEmail = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("Email is already verified");
  }

  // Delete old OTP
  await Otp.deleteMany({
    email,
    purpose: "EMAIL_VERIFICATION",
  });

  // Generate new OTP
  const otp = generateOTP();

  await Otp.create({
    user: user._id,
    email,
    otp,
    purpose: "EMAIL_VERIFICATION",
    expiresAt: getOTPExpiry(),
  });

  // Send email
  await sendEmail({
    to: email,
    subject: "Verify Your TurfX Account",
    html: `
      <h2>Email Verification</h2>

      <p>Your verification OTP is:</p>

      <h1 style="letter-spacing:5px">${otp}</h1>

      <p>This OTP will expire in <b>10 minutes</b>.</p>
    `,
  });

  return {
    message: "Verification email sent successfully",
  };
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  refreshAccessToken,

  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,

  verifyEmail,
  resendVerificationEmail,
};