const crypto = require("crypto");
const hashOTP = (otp) => {
  const key = process.env.OTP_SECRET || process.env.JWT_SECRET;
  if (!key) throw new Error("OTP secret is not configured");
  return crypto.createHmac("sha256", key).update(String(otp)).digest("hex");
};
const verifyOTP = (otp, stored) => {
  if (typeof stored !== "string" || !/^[a-f0-9]{64}$/.test(stored)) return false;
  return crypto.timingSafeEqual(Buffer.from(hashOTP(otp), "hex"), Buffer.from(stored, "hex"));
};
module.exports = { hashOTP, verifyOTP };
