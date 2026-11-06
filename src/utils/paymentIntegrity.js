const crypto = require("crypto");
const ApiError = require("./ApiError");

const signaturesMatch = (expected, supplied) => {
  if (typeof supplied !== "string" || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(supplied, "hex"));
};

const requireBookingOwner = (booking, actorId) => {
  if (!actorId || String(booking.user?._id || booking.user) !== String(actorId)) {
    throw new ApiError(403, "You cannot pay for another customer's booking");
  }
};

const verifyOrderBinding = (booking, payment, orderId) => {
  if (!orderId || orderId !== booking.payment.orderId || orderId !== payment.razorpay.orderId) {
    throw new ApiError(400, "Payment order does not belong to this booking");
  }
};

module.exports = { signaturesMatch, requireBookingOwner, verifyOrderBinding };
