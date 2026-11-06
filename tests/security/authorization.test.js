jest.mock("../../src/modules/user/user.model", () => ({ findById: jest.fn() }));
jest.mock("../../src/modules/turf/turf.model", () => ({ findById: jest.fn() }));
jest.mock("../../src/modules/booking/booking.model", () => ({
  findById: jest.fn(),
  find: jest.fn(),
}));
jest.mock("../../src/modules/wallet/wallet.service", () => ({
  debitWallet: jest.fn(),
}));
const request = require("supertest");
const User = require("../../src/modules/user/user.model");
const Turf = require("../../src/modules/turf/turf.model");
const Booking = require("../../src/modules/booking/booking.model");
const Wallet = require("../../src/modules/wallet/wallet.service");
const { generateAccessToken } = require("../../src/utils/generateToken");
const bookingService = require("../../src/modules/booking/booking.service");
const slotService = require("../../src/modules/slot/slot.service");
const app = require("../../src/app");
const id = "507f1f77bcf86cd799439011";
beforeEach(() => {
  jest.clearAllMocks();
  User.findById.mockResolvedValue({
    _id: id,
    role: "user",
    tokenVersion: 0,
    isDeleted: false,
    isBlocked: false,
  });
});
it("rejects a soft-deleted account even with a valid access signature", async () => {
  User.findById.mockResolvedValue({
    _id: id,
    isDeleted: true,
    tokenVersion: 0,
  });
  const res = await request(app)
    .get("/api/v1/auth/me")
    .set("Authorization", `Bearer ${generateAccessToken({ id, version: 0 })}`);
  expect(res.status).toBe(401);
});
it("rejects revoked access token versions", async () => {
  const res = await request(app)
    .get("/api/v1/auth/me")
    .set("Authorization", `Bearer ${generateAccessToken({ id, version: 1 })}`);
  expect(res.status).toBe(401);
});
it("rejects tokens minted for the separate administrator realm", async () => {
  const res = await request(app)
    .get("/api/v1/auth/me")
    .set(
      "Authorization",
      `Bearer ${generateAccessToken({ id, version: 0, realm: "admin" })}`,
    );
  expect(res.status).toBe(401);
});
it("prevents cross-owner booking listing", async () => {
  Turf.findById.mockResolvedValue({ owner: "owner-1" });
  await expect(
    bookingService.getTurfBookings("fixture", {}, "owner-2"),
  ).rejects.toMatchObject({ statusCode: 403 });
  expect(Booking.find).not.toHaveBeenCalled();
});
it("prevents cross-owner completion", async () => {
  Booking.findById.mockResolvedValue({
    owner: "owner-1",
    bookingStatus: "confirmed",
  });
  await expect(
    bookingService.completeBooking("fixture", "owner-2"),
  ).rejects.toMatchObject({ statusCode: 403 });
});
it("prevents cross-owner slot listing", async () => {
  Turf.findById.mockResolvedValue({ owner: "owner-1" });
  await expect(
    slotService.getSlotsByTurf(
      "fixture",
      {},
      { _id: "owner-2", role: "owner" },
    ),
  ).rejects.toMatchObject({ statusCode: 403 });
});
it("never delegates a withdrawal to a caller-selected victim wallet", async () => {
  const res = await request(app)
    .post("/api/v1/wallet/withdraw")
    .set(
      "Authorization",
      `Bearer ${generateAccessToken({ id, version: 0, role: "user" })}`,
    )
    .send({
      userId: "507f1f77bcf86cd799439012",
      amount: 100,
      type: "debit",
      accountNumber: "123456789012",
      ifscCode: "SBIN0001234",
      accountHolderName: "Fixture User",
    });
  expect(res.status).toBe(503);
  expect(Wallet.debitWallet).not.toHaveBeenCalled();
});
