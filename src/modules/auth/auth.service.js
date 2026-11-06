const jwt = require("jsonwebtoken");
const { hashOTP, verifyOTP } = require("../../utils/otpSecret");
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
  hashToken,
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
  version: user.tokenVersion || 0,
});

const refreshToken = generateRefreshToken({
  id: user._id,
});

// Save refresh token
user.refreshToken = hashToken(refreshToken);
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
    otp: hashOTP(otp),
    purpose: "EMAIL_VERIFICATION",
    expiresAt: getOTPExpiry(),
  });

  // Send Email
  await sendEmail({
    to: email,
    subject: "Verify your PLAYZA account",
    html: `
      <h2>Welcome to PLAYZA</h2>

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




if (!user || user.isDeleted) {
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
  version: user.tokenVersion || 0,
});

const refreshToken = generateRefreshToken({
  id: user._id,
});

  user.refreshToken = hashToken(refreshToken);

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
      throw new ApiError(400,
        "User not found"
      );
    }

    return user;
  };

// ==========================================
// Refresh Token
// ==========================================

const refreshAccessToken = async (refreshToken) => {
  if (typeof refreshToken !== "string") throw new ApiError(401, "Refresh token is required");
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, { algorithms: ["HS256"] });
  if (decoded.type !== "refresh" || decoded.realm !== "user") throw new ApiError(401, "Invalid refresh token");
  const replacement = generateRefreshToken({ id: decoded.id });
  // Compare-and-swap ensures simultaneous refresh requests cannot both rotate a token.
  const user = await User.findOneAndUpdate({
    _id: decoded.id, refreshToken: hashToken(refreshToken), isBlocked: false, isDeleted: false,
  }, { $set: { refreshToken: hashToken(replacement) } }, { new: true });
  if (!user) throw new ApiError(401, "Invalid or revoked refresh token");
  return { accessToken: generateAccessToken({ id: user._id, role: user.role,
    version: user.tokenVersion || 0 }), refreshToken: replacement };
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
    throw new ApiError(400,
      "User not found"
    );
  }

  user.refreshToken = null;
  user.tokenVersion = (user.tokenVersion || 0) + 1;

  await user.save();

  return true;
};

// ==========================================
// Forgot Password
// ==========================================

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "User not found");
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
    otp: hashOTP(otp),
    purpose: "FORGOT_PASSWORD",
    expiresAt: getOTPExpiry(),
  });

  // Send Email
  await sendEmail({
    to: email,
    subject: "Reset Your PLAYZA Password",
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

const attemptChallenge = async (email, purpose) => {
  const challenge = await Otp.findOneAndUpdate({ email, purpose,
    expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } },
    { $inc: { attempts: 1 } }, { returnDocument: "after" }).select("+otp");
  if (!challenge) throw new ApiError(400, "OTP is invalid, expired or attempts exhausted");
  return challenge;
};

const verifyOtp = async (email, otp, purpose = "FORGOT_PASSWORD") => {
  const challenge = await attemptChallenge(email, purpose);
  if (!verifyOTP(otp, challenge.otp)) throw new ApiError(400, "Invalid OTP");
  // Conditional update cannot recreate a challenge concurrently consumed or replaced.
  const result = await Otp.updateOne({ _id: challenge._id, otp: challenge.otp }, { $set: { verified: true } });
  if (result.matchedCount !== 1) throw new ApiError(400, "OTP is no longer available");
  return { message: "OTP verified successfully" };
};

// ==========================================
// Reset Password
// ==========================================

const resetPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ email, isDeleted: false, isBlocked: false }).select("+password");
  if (!user) throw new ApiError(400, "Invalid password reset request");
  const challenge = await Otp.findOneAndDelete({ email, purpose: "FORGOT_PASSWORD",
    verified: true, otp: hashOTP(otp), expiresAt: { $gt: new Date() } });
  if (!challenge) throw new ApiError(400, "OTP is invalid, expired or not verified");
  user.password = newPassword;
  user.refreshToken = null;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  return { message: "Password reset successfully" };
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
    throw new ApiError(400, "User not found");
  }

  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword;
  user.refreshToken = null;
  user.tokenVersion = (user.tokenVersion || 0) + 1;

  await user.save();

  return {
    message: "Password changed successfully",
  };
};

// ==========================================
// Verify Email
// ==========================================

const verifyEmail = async (email, otp) => {
  const challenge = await attemptChallenge(email, "EMAIL_VERIFICATION");
  if (!verifyOTP(otp, challenge.otp)) throw new ApiError(400, "Invalid OTP");
  const consumed = await Otp.findOneAndDelete({ _id: challenge._id, otp: challenge.otp });
  if (!consumed) throw new ApiError(400, "OTP is no longer available");
  const user = await User.findOne({ email, isDeleted: false, isBlocked: false });
  if (!user) throw new ApiError(400, "Invalid email verification request");
  user.isVerified = true;
  await user.save();
  return { message: "Email verified successfully" };
};

// ==========================================
// Resend Verification Email
// ==========================================

const resendVerificationEmail = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email is already verified");
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
    otp: hashOTP(otp),
    purpose: "EMAIL_VERIFICATION",
    expiresAt: getOTPExpiry(),
  });

  // Send email
  await sendEmail({
    to: email,
    subject: "Verify Your PLAYZA Account",
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
