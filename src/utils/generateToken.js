const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateAccessToken = (payload) => jwt.sign(
  { realm: "user", ...payload, type: "access" }, process.env.JWT_SECRET,
  { algorithm: "HS256", expiresIn: process.env.JWT_EXPIRE || "15m" }
);
const generateRefreshToken = (payload) => jwt.sign(
  { realm: "user", ...payload, type: "refresh" }, process.env.REFRESH_TOKEN_SECRET,
  { algorithm: "HS256", expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "7d", jwtid: crypto.randomUUID() }
);
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
module.exports = { generateAccessToken, generateRefreshToken, hashToken };
