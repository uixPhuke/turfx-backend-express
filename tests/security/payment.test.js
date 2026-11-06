jest.mock("../../src/modules/booking/booking.model", () => ({
  findById: jest.fn(),
}));
jest.mock("../../src/modules/payment/payment.model", () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));
jest.mock("../../src/modules/slot/slot.service", () => ({
  releaseSlot: jest.fn(),
}));
jest.mock("razorpay", () => jest.fn());
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Booking = require("../../src/modules/booking/booking.model");
const Payment = require("../../src/modules/payment/payment.model");
const fetchPayment = jest.fn();
const refund = jest.fn();
Razorpay.mockImplementation(() => ({
  payments: { fetch: fetchPayment, refund },
}));
const service = require("../../src/modules/payment/payment.service");
const { signaturesMatch } = require("../../src/utils/paymentIntegrity");
let booking, payment, request;
beforeEach(() => {
  jest.clearAllMocks();
  booking = {
    _id: "booking-1",
    user: "customer-1",
    bookingStatus: "pending",
    payment: { orderId: "order-1" },
    pricing: { totalAmount: 100 },
    save: jest.fn().mockResolvedValue(),
  };
  payment = {
    _id: "payment-1",
    status: "pending",
    booking: booking._id,
    razorpay: { orderId: "order-1", paymentId: "pay-1" },
    amount: { total: 100 },
    refund: {},
    save: jest.fn().mockResolvedValue(),
  };
  Booking.findById.mockResolvedValue(booking);
  Payment.findOne.mockResolvedValue(payment);
  Payment.findById.mockResolvedValue(payment);
  Payment.findOneAndUpdate.mockImplementation(async (where, update) => {
    payment.refund = update.$set.refund;
    return payment;
  });
  request = {
    bookingId: booking._id,
    razorpay_order_id: "order-1",
    razorpay_payment_id: "pay-1",
  };
  request.razorpay_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update("order-1|pay-1")
    .digest("hex");
  fetchPayment.mockResolvedValue({
    id: "pay-1",
    order_id: "order-1",
    amount: 10000,
    currency: "INR",
    status: "captured",
  });
});
it("rejects a valid signature from an unrelated order before mutating records", async () => {
  request.razorpay_order_id = "other-order";
  request.razorpay_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update("other-order|pay-1")
    .digest("hex");
  await expect(
    service.verifyPayment(request, "customer-1"),
  ).rejects.toMatchObject({ statusCode: 400 });
  expect(payment.save).not.toHaveBeenCalled();
  expect(fetchPayment).not.toHaveBeenCalled();
});
it("rejects a different customer", async () => {
  await expect(
    service.verifyPayment(request, "attacker"),
  ).rejects.toMatchObject({ statusCode: 403 });
});
it("rejects an uncaptured or incorrectly priced payment", async () => {
  fetchPayment.mockResolvedValue({
    order_id: "order-1",
    status: "captured",
    amount: 1,
    currency: "INR",
  });
  await expect(
    service.verifyPayment(request, "customer-1"),
  ).rejects.toMatchObject({ statusCode: 409 });
  expect(booking.save).not.toHaveBeenCalled();
});
it("confirms only a captured payment bound to the customer, order and amount", async () => {
  await service.verifyPayment(request, "customer-1");
  expect(booking.bookingStatus).toBe("confirmed");
  expect(payment.status).toBe("paid");
});
it("does not reconfirm an expired hold", async () => {
  booking.bookingStatus = "expired";
  await expect(
    service.verifyPayment(request, "customer-1"),
  ).rejects.toMatchObject({ statusCode: 409 });
});
it("returns the same successful result for a repeated verification", async () => {
  payment.status = "paid";
  booking.bookingStatus = "confirmed";
  await service.verifyPayment(request, "customer-1");
  expect(fetchPayment).not.toHaveBeenCalled();
});
it("requests an actual refund and preserves pending provider status", async () => {
  payment.status = "paid";
  refund.mockResolvedValue({ id: "refund-1", status: "pending" });
  await service.refundPayment(payment._id);
  expect(refund).toHaveBeenCalledWith(
    "pay-1",
    expect.objectContaining({ amount: 10000 }),
  );
  expect(payment.refund.status).toBe("pending");
  expect(payment.status).toBe("paid");
});
it("keeps ambiguous gateway failures pending for reconciliation", async () => {
  payment.status = "paid";
  refund.mockRejectedValue(new Error("timeout"));
  await expect(service.refundPayment(payment._id)).rejects.toMatchObject({
    statusCode: 502,
  });
  expect(payment.refund.status).toBe("pending");
  expect(payment.status).toBe("paid");
});
it("verifies exact raw webhook bytes rather than reserialized JSON", async () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = "fixture-webhook-secret";
  const raw = Buffer.from('{ "event": "unknown", "payload": {} }');
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(raw)
    .digest("hex");
  await expect(
    service.handleWebhook(signature, JSON.parse(raw), raw),
  ).resolves.toEqual({ received: true });
  await expect(
    service.handleWebhook(
      signature,
      JSON.parse(raw),
      Buffer.from(JSON.stringify(JSON.parse(raw))),
    ),
  ).rejects.toMatchObject({ statusCode: 400 });
});
it("safely rejects malformed signatures", () => {
  expect(signaturesMatch("a".repeat(64), "xx")).toBe(false);
  expect(signaturesMatch("a".repeat(64), undefined)).toBe(false);
});
