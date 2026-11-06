const crypto = require("crypto");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../src/modules/user/user.model");
const Turf = require("../src/modules/turf/turf.model");
const Slot = require("../src/modules/slot/slot.model");
const Booking = require("../src/modules/booking/booking.model");

const app = require("../src/app");

// ==========================================
// Mock Razorpay
// ==========================================

jest.mock("razorpay", () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: "order_test_123",
        amount: 110000,
        currency: "INR",
        status: "created",
      }),
    },

    payments: {
      refund: jest.fn().mockResolvedValue({ id: "rfnd_test_123", status: "processed" }),
      fetch: jest.fn().mockResolvedValue({
        id: "pay_test_123",
        status: "captured",
          order_id: "order_test_123",
          amount: 110000,
          currency: "INR",
      }),
    },

    refunds: {
      create: jest.fn().mockResolvedValue({
        id: "rfnd_test_123",
        status: "processed",
      }),
    },
  }));
});

// ==========================================
// Variables
// ==========================================

let mongoServer;

let token;
let adminToken;

let user;
let owner;

let turf;
let slot;
let booking;

let bookingId;
let paymentId;

// ==========================================
// Setup
// ==========================================

beforeAll(async () => {

  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());

  // ======================================
  // Register User
  // ======================================

  await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Ruhon",
      email: "payment@test.com",
      phone: "9999999999",
      password: "Password@123",
    });

  // ======================================
  // Register Admin
  // ======================================

  await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Admin",
      email: "admin@test.com",
      phone: "7777777777",
      password: "Password@123",
    });

  await User.updateOne(
    { email: "admin@test.com" },
    { role: "admin" }
  );

  // ======================================
  // Owner
  // ======================================

  owner = await User.create({
    name: "Owner",
    email: "owner@test.com",
    phone: "8888888888",
    password: "Password@123",
    role: "owner",
  });

  // ======================================
  // Login User
  // ======================================

  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: "payment@test.com",
      password: "Password@123",
    });

  expect(login.statusCode).toBe(200);

  token = login.body.data.accessToken;

  user = await User.findOne({
    email: "payment@test.com",
  });

  // ======================================
  // Login Admin
  // ======================================

  const adminLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: "admin@test.com",
      password: "Password@123",
    });

  expect(adminLogin.statusCode).toBe(200);

  adminToken = adminLogin.body.data.accessToken;

  // ======================================
  // Create Turf
  // ======================================

  turf = await Turf.create({

    owner: owner._id,

    name: "Test Turf",

    description: "Test Turf",

    images: [
      {
        public_id: "1",
        url: "https://test.com/test.jpg",
      },
    ],

    sports: ["football"],

    pricing: {
      weekday: 1000,
      weekend: 1200,
      holiday: 1500,
    },

    workingHours: {
      is24Hours: true,
    },

    contact: {
      phone: "9999999999",
      email: "owner@test.com",
    },

    facilities: {},

    address: {
      state: "Assam",
      city: "Jorhat",
      area: "Gar Ali",
      pincode: "785001",
      fullAddress: "Gar Ali",
    },

    location: {
      type: "Point",
      coordinates: [94.2, 26.75],
    },

    isApproved: true,
    isVerified: true,
  });

  // ======================================
  // Create Slot
  // ======================================

  slot = await Slot.create({

    turf: turf._id,

    owner: owner._id,

    bookingDate: new Date(),

    startTime: "10:00",

    endTime: "11:00",

    price: 1000,

  });

  // ======================================
  // Create Booking
  // ======================================

  booking = await Booking.create({

    bookingNumber: "BK1001",

    user: user._id,

    owner: owner._id,

    turf: turf._id,

    slot: slot._id,

    bookingDate: new Date(),

    startTime: "10:00",

    endTime: "11:00",

    duration: 60,

    players: 10,

    sport: "football",

    pricing: {
      slotPrice: 1000,
      convenienceFee: 50,
      tax: 50,
      discount: 0,
      totalAmount: 1100,
    },

    bookingStatus: "pending",

  });

  bookingId = booking._id;

});
// ==========================================
// Payment APIs
// ==========================================

describe("Payment APIs", () => {

  // ========================================
  // Create Razorpay Order
  // ========================================

  describe("POST /api/v1/payments/create-order", () => {

    it("should create payment order", async () => {

      const res = await request(app)
        .post("/api/v1/payments/create-order")
        .set(
          "Authorization",
          `Bearer ${token}`
        )
        .send({
          bookingId,
          paymentMethod: "razorpay",
        });

      console.log(res.body);

      expect(res.statusCode).toBe(201);

      expect(res.body.success).toBe(true);

      expect(
        res.body.data.razorpayOrder.id
      ).toBe("order_test_123");

    });

  });

  // ========================================
  // Verify Payment
  // ========================================

  describe("POST /api/v1/payments/verify", () => {

    it("should verify payment", async () => {

      const signature = crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          "order_test_123|pay_test_123"
        )
        .digest("hex");

      const res = await request(app)
        .post("/api/v1/payments/verify")
        .set(
          "Authorization",
          `Bearer ${token}`
        )
        .send({
          bookingId,

          razorpay_order_id:
            "order_test_123",

          razorpay_payment_id:
            "pay_test_123",

          razorpay_signature:
            signature,
        });

      console.log(res.body);

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

      paymentId =
        res.body.data.payment._id;

    });

  });

  // ========================================
  // Payment Details
  // ========================================

  describe("GET /api/v1/payments/:id", () => {

    it("should fetch payment", async () => {

      const res = await request(app)
        .get(
          `/api/v1/payments/${paymentId}`
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        );

      console.log(res.body);

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

    });

  });

  // ========================================
  // Refund Payment
  // ========================================

  describe("PATCH /api/v1/payments/:id/refund", () => {

    it("should refund payment", async () => {

      const res = await request(app)
        .patch(
          `/api/v1/payments/${paymentId}/refund`
        )
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          reason:
            "Booking Cancelled",
        });

      console.log(res.body);

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

    });

  });

});


// ==========================================
// Cleanup
// ==========================================

afterAll(async () => {

  await mongoose.connection.dropDatabase();

  await mongoose.connection.close();

  if (mongoServer) {
    await mongoServer.stop();
  }

});