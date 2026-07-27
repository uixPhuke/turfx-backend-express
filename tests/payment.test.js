const crypto = require("crypto");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/modules/user/user.model");
const Turf = require("../src/modules/turf/turf.model");
const Slot = require("../src/modules/slot/slot.model");
const Booking = require("../src/modules/booking/booking.model");

const app = require("../src/app");

let user;
let owner;
let turf;
let slot;
let booking;
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
owner = await User.create({
  name: "Owner",
  email: "owner@test.com",
  phone: "8888888888",
  password: "Password@123",
  role: "owner",
});
await User.create({
  name: "Admin",
  email: "admin@test.com",
  phone: "7777777777",
  password: "Password@123",
  role: "admin",
});

const adminLogin = await request(app)
  .post("/api/v1/auth/login")
  .send({
    email: "admin@test.com",
    password: "Password@123",
  });

adminToken = adminLogin.body.data.accessToken;
  // Login

  const login = await request(app)
  .post("/api/v1/auth/login")
  .send({
    email: "payment@test.com",
    password: "Password@123",
  });

token = login.body.data.accessToken;
user = await User.findOne({
  email: "payment@test.com",
});
  token =
    login.body.data.accessToken;

  // Assume Booking Already Exists
  // Replace with actual booking creation if required

    turf = await Turf.create({
  owner: owner._id,

  name: "Test Turf",
  description: "Test Turf",

  images: [{
    public_id: "1",
    url: "https://test.com/test.jpg",
  }],

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
slot = await Slot.create({
  turf: turf._id,
  owner: owner._id,

  bookingDate: new Date(),

  startTime: "10:00",
  endTime: "11:00",

  price: 1000,
});
booking = await Booking.create({
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
});

bookingId = booking._id;
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
const signature = crypto
  .createHmac(
    "sha256",
    process.env.RAZORPAY_KEY_SECRET
  )
  .update("order_test_123|pay_test_123")
  .digest("hex");

const res = await request(app)
  .post("/api/v1/payments/verify")
  .set("Authorization", `Bearer ${token}`)
  .send({
    bookingId,
    razorpay_order_id: "order_test_123",
    razorpay_payment_id: "pay_test_123",
    razorpay_signature: signature,
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

  // describe("GET Status", () => {

  //   it("should return payment status", async () => {

  //     const res =
  //       await request(app)

  //         .get(
  //           `/api/v1/payments/status/${bookingId}`
  //         )

  //         .set(
  //           "Authorization",
  //           `Bearer ${token}`
  //         );

  //     expect(res.statusCode)
  //       .toBe(200);

  //   });

  // });

  // ============================
  // Refund
  // ============================

  describe("POST Refund", () => {

    it("should refund payment", async () => {

      const res =
        await request(app)

       .patch(`/api/v1/payments/${paymentId}/refund`)

         .set(
  "Authorization",
  `Bearer ${adminToken}`
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

  // describe("GET Statistics", () => {

  //   it("should return payment stats", async () => {

  //     const res =
  //       await request(app)

  //         .get(
  //           "/api/v1/payments/statistics"
  //         )

  //         .set(
  //           "Authorization",
  //           `Bearer ${token}`
  //         );

  //     expect(res.statusCode)
  //       .toBe(200);

  //   });

  // });

});
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  if (mongoServer) {
    await mongoServer.stop();
  }
});