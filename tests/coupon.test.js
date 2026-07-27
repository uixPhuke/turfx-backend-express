const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/modules/user/user.model");
const Turf = require("../src/modules/turf/turf.model");

const app = require("../src/app");

let mongoServer;

let token;
let couponId;
let turf;

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
      name: "Admin",

      email: "coupon@test.com",

      phone: "9999999999",

      password: "Password@123",
    });
await User.updateOne(
  { email: "coupon@test.com" },
  { role: "admin" }
);
  // Login

  const login =
    await request(app)

      .post("/api/v1/auth/login")

      .send({
        email: "coupon@test.com",

        password: "Password@123",
      });

expect(login.statusCode).toBe(200);

console.log(login.body.data.user.role);
  token =
    login.body.data.accessToken;
    const admin = await User.findOne({
  email: "coupon@test.com",
});

turf = await Turf.create({
  owner: admin._id,

  name: "Test Turf",
  description: "Test Turf Description",

  images: [
    {
      public_id: "test",
      url: "https://example.com/test.jpg",
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
    fullAddress: "Gar Ali, Jorhat",
  },

  location: {
    type: "Point",
    coordinates: [94.2037, 26.7509],
  },

  isApproved: true,
  isVerified: true,
});
});

describe("Coupon APIs", () => {

  // =================================
  // Create Coupon
  // =================================

  describe("POST /api/v1/coupons", () => {

    it("should create coupon", async () => {

      const res =
        await request(app)

          .post("/api/v1/coupons")

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            code: "SAVE200",

            title: "Flat Discount",

            description:
              "₹200 OFF",

            type: "flat",

            value: 200,

            minimumBookingAmount:
              1000,

            maximumDiscount: 200,

            usageLimit: 100,

            usagePerUser: 1,

            validFrom:
              new Date(),

            validUntil:
              new Date(
                Date.now() +
                86400000
              ),

            isGlobal: true,

          });

      expect(res.statusCode)
        .toBe(201);

      expect(res.body.success)
        .toBe(true);

      couponId =
        res.body.data._id;

    });

  });

  // =================================
  // Get All Coupons
  // =================================

  describe("GET Coupons", () => {

    it("should return coupons", async () => {

      const res =
        await request(app)

          .get("/api/v1/coupons")

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =================================
  // Coupon Details
  // =================================

  describe("GET Coupon", () => {

    it("should return coupon", async () => {

      const res =
        await request(app)

          .get(
            `/api/v1/coupons/${couponId}`
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =================================
  // Validate Coupon
  // =================================

  describe("POST Validate", () => {

    it("should validate coupon", async () => {

      const res =
        await request(app)

          .post(
            "/api/v1/coupons/validate"
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            code: "SAVE200",

            bookingAmount: 1500,

          });

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =================================
  // Apply Coupon
  // =================================

  describe("POST Apply", () => {

    it("should apply coupon", async () => {

      const res =
        await request(app)

          .post(
            "/api/v1/coupons/apply"
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({
  code: "SAVE200",
  bookingAmount: 1500,
  turfId: turf._id,
});
console.log(res.body);
      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =================================
  // Update Coupon
  // =================================

  describe("PATCH Coupon", () => {

    it("should update coupon", async () => {

      const res =
        await request(app)

          .patch(
            `/api/v1/coupons/${couponId}`
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            value: 300,

            maximumDiscount: 300,

          });

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =================================
  // Activate Coupon
  // =================================

  describe("PATCH Activate", () => {

    it("should activate coupon", async () => {

      const res =
        await request(app)

        .patch(`/api/v1/coupons/${couponId}/toggle`)

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =================================
  // Deactivate Coupon
  // =================================

  describe("PATCH Deactivate", () => {

    it("should deactivate coupon", async () => {

      const res =
        await request(app)

        .patch(`/api/v1/coupons/${couponId}/toggle`)

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =================================
  // Statistics
  // =================================

  describe("GET Statistics", () => {

    it("should return coupon stats", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/coupons/statistics"
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =================================
  // Delete Coupon
  // =================================

  describe("DELETE Coupon", () => {

    it("should delete coupon", async () => {

      const res =
        await request(app)

          .delete(
            `/api/v1/coupons/${couponId}`
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

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  if (mongoServer) {
    await mongoServer.stop();
  }
});