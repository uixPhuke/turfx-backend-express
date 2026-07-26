const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");

// Mock Razorpay
jest.mock("razorpay", () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: "order_test_123",
        amount: 100000,
        currency: "INR",
        status: "created",
      }),
    },

    payments: {
      fetch: jest.fn().mockResolvedValue({
        id: "pay_test_123",
        status: "captured",
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

let mongoServer;

let token;
let bookingId;
let paymentId;

beforeAll(async () => {
  mongoServer =
    await MongoMemoryServer.create();

  await mongoose.connect(
    mongoServer.getUri()
  );

  // Register

  await request(app)

    .post("/api/v1/auth/register")

    .send({
      name: "Ruhon",

      email: "payment@test.com",

      phone: "9999999999",

      password: "Password@123",
    });

  // Login

  const login =
    await request(app)

      .post("/api/v1/auth/login")

      .send({
        email: "payment@test.com",

        password: "Password@123",
      });

  token =
    login.body.data.accessToken;

  // Assume Booking Already Exists
  // Replace with actual booking creation if required

  bookingId =
    new mongoose.Types.ObjectId();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();

  await mongoose.connection.close();

  await mongoServer.stop();
});

describe("Payment APIs", () => {

  // ============================
  // Create Razorpay Order
  // ============================

  describe("POST /api/v1/payments/create-order", () => {

    it("should create payment order", async () => {

      const res =
        await request(app)

          .post(
            "/api/v1/payments/create-order"
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            bookingId,

            paymentMethod:
              "razorpay",

          });

      expect(res.statusCode)
        .toBe(201);

      expect(res.body.success)
        .toBe(true);

      expect(
        res.body.data.orderId
      ).toBeDefined();

    });

  });

  // ============================
  // Verify Payment
  // ============================

  describe("POST /api/v1/payments/verify", () => {

    it("should verify payment", async () => {

      const res =
        await request(app)

          .post(
            "/api/v1/payments/verify"
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            razorpay_order_id:
              "order_test_123",

            razorpay_payment_id:
              "pay_test_123",

            razorpay_signature:
              "signature",

          });

      expect(res.statusCode)
        .toBe(200);

      expect(res.body.success)
        .toBe(true);

      paymentId =
        res.body.data._id;

    });

  });

  // ============================
  // Payment Details
  // ============================

  describe("GET Payment", () => {

    it("should fetch payment", async () => {

      const res =
        await request(app)

          .get(
            `/api/v1/payments/${paymentId}`
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ============================
  // Payment Status
  // ============================

  describe("GET Status", () => {

    it("should return payment status", async () => {

      const res =
        await request(app)

          .get(
            `/api/v1/payments/status/${bookingId}`
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ============================
  // Refund
  // ============================

  describe("POST Refund", () => {

    it("should refund payment", async () => {

      const res =
        await request(app)

          .post(
            `/api/v1/payments/${paymentId}/refund`
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            reason:
              "Booking Cancelled",

          });

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ============================
  // Statistics
  // ============================

  describe("GET Statistics", () => {

    it("should return payment stats", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/payments/statistics"
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

});