const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");

const User = require("../src/modules/user/user.model");
const Turf = require("../src/modules/turf/turf.model");

let mongoServer;

let ownerToken;
let userToken;

let ownerId;
let userId;

let turfId;
let bookingId;

beforeAll(async () => {
  // ============================
  // MongoDB Memory Server
  // ============================

  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());

  // ============================
  // Register Owner
  // ============================

  await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Owner",
      email: "owner@test.com",
      phone: "9999999991",
      password: "Password@123",
    });

  // Make Owner

  const owner = await User.findOne({
    email: "owner@test.com",
  });

  owner.role = "owner";
  owner.isVerified = true;
  owner.ownerDetails.isApproved = true;

  await owner.save();

  ownerId = owner._id;

  // ============================
  // Login Owner
  // ============================

  const ownerLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: "owner@test.com",
      password: "Password@123",
    });

  ownerToken =
    ownerLogin.body.data.accessToken;

  // ============================
  // Register Customer
  // ============================

  await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Customer",
      email: "user@test.com",
      phone: "9999999992",
      password: "Password@123",
    });

  const user = await User.findOne({
    email: "user@test.com",
  });

  user.isVerified = true;

  await user.save();

  userId = user._id;

  // ============================
  // Login Customer
  // ============================

  const userLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: "user@test.com",
      password: "Password@123",
    });

  userToken =
    userLogin.body.data.accessToken;

  // ============================
  // Create Turf
  // ============================

  const turf = await Turf.create({
    owner: ownerId,

    name: "Green Valley Turf",

    description:
      "Premium Football Turf",

    images: [
      {
        public_id: "sample",
        url: "https://example.com/turf.jpg",
      },
    ],

    sports: ["football"],

    pricing: {
      weekday: 1000,
      weekend: 1200,
      holiday: 1500,
    },

    workingHours: {
      is24Hours: false,
      open: "06:00",
      close: "22:00",
    },

    slotDuration: 60,

    maxPlayers: 14,

    contact: {
      phone: "9999999991",
      email: "owner@test.com",
    },

    facilities: {
      parking: true,
      washroom: true,
      floodLights: true,
      drinkingWater: true,
    },

    address: {
      state: "Assam",
      city: "Jorhat",
      area: "Garamur",
      pincode: "785007",
      fullAddress:
        "Garamur, Jorhat, Assam",
    },

    location: {
      type: "Point",
      coordinates: [94.2037, 26.7509],
    },

    isApproved: true,
    isVerified: true,
    isActive: true,
  });

  turfId = turf._id;
});

// ==========================================
// Booking APIs
// ==========================================

describe("Booking APIs", () => {

  // ==========================================
  // Create Booking
  // ==========================================

  describe("POST /api/v1/bookings", () => {

    it("should create booking", async () => {

      const res = await request(app)
        .post("/api/v1/bookings")
        .set(
          "Authorization",
          `Bearer ${userToken}`
        )
        .send({
          turf: turfId,

          bookingDate: "2026-08-15",

          startTime: "18:00",

          endTime: "19:00",

          players: 10,

          sport: "football",
        });

      console.log(res.body);

      expect(res.statusCode).toBe(201);

      expect(res.body.success).toBe(true);

      bookingId = res.body.data._id;

    });

  });

  // ==========================================
  // Duplicate Booking
  // ==========================================

  describe("Duplicate Booking", () => {

    it("should reject duplicate booking", async () => {

      const res = await request(app)
        .post("/api/v1/bookings")
        .set(
          "Authorization",
          `Bearer ${userToken}`
        )
        .send({
          turf: turfId,

          bookingDate: "2026-08-15",

          startTime: "18:00",

          endTime: "19:00",

          players: 10,

          sport: "football",
        });

      expect(res.statusCode).toBe(409);

    });

  });

  // ==========================================
  // My Bookings
  // ==========================================

  describe("GET /api/v1/bookings/my-bookings", () => {

    it("should return my bookings", async () => {

      const res = await request(app)
        .get("/api/v1/bookings/my-bookings")
        .set(
          "Authorization",
          `Bearer ${userToken}`
        );

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

    });

  });

  // ==========================================
  // Booking Details
  // ==========================================

  describe("GET /api/v1/bookings/:id", () => {

    it("should return booking details", async () => {

      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set(
          "Authorization",
          `Bearer ${userToken}`
        );

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

    });

  });

  // ==========================================
  // Cancel Booking
  // ==========================================

  describe("PATCH Cancel Booking", () => {

    it("should cancel booking", async () => {

      const res = await request(app)
        .patch(
          `/api/v1/bookings/${bookingId}/cancel`
        )
        .set(
          "Authorization",
          `Bearer ${userToken}`
        )
        .send({
          reason: "Plan Changed",
        });

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

    });

  });

});
// ==========================================
// Owner Routes
// ==========================================

describe("Owner Booking APIs", () => {

  // ==========================================
  // Get All Owner Bookings
  // ==========================================

  describe("GET /api/v1/bookings/owner/all", () => {

    it("should return owner bookings", async () => {

      const res = await request(app)
        .get("/api/v1/bookings/owner/all")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`
        );

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

    });

  });

  // ==========================================
  // Get Today's Bookings
  // ==========================================

  describe("GET /api/v1/bookings/owner/today", () => {

    it("should return today's bookings", async () => {

      const res = await request(app)
        .get("/api/v1/bookings/owner/today")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`
        );

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

    });

  });

  // ==========================================
  // Booking Calendar
  // ==========================================

  describe("GET /api/v1/bookings/owner/calendar", () => {

    it("should return booking calendar", async () => {

      const res = await request(app)
        .get("/api/v1/bookings/owner/calendar")
        .query({
          month: 8,
          year: 2026,
        })
        .set(
          "Authorization",
          `Bearer ${ownerToken}`
        );

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

    });

  });

  // ==========================================
  // Owner Dashboard
  // ==========================================

  describe("GET /api/v1/bookings/owner/dashboard", () => {

    it("should return dashboard", async () => {

      const res = await request(app)
        .get("/api/v1/bookings/owner/dashboard")
        .set(
          "Authorization",
          `Bearer ${ownerToken}`
        );

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

    });

  });

});

// ==========================================
// Cleanup
// ==========================================

afterAll(async () => {

  if (mongoose.connection.readyState === 1) {

    await mongoose.connection.dropDatabase();

    await mongoose.connection.close();

  }

  if (mongoServer) {

    await mongoServer.stop();

  }

});