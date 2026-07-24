// src/utils/generateOTP.js

const crypto = require("crypto");

const generateOTP = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  return crypto.randomInt(min, max + 1).toString();
};

const getOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = {
  generateOTP,
  getOTPExpiry,
};