const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");

let mongoServer;

let token;
let turfId;
let slotId;
let bookingId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(
    mongoServer.getUri()
  );

  // Register

  await request(app)

    .post("/api/v1/auth/register")

    .send({
      name: "Ruhon",

      email: "ruhon@test.com",

      phone: "9999999999",

      password: "Password@123",
    });

  // Login

  const login = await request(app)

    .post("/api/v1/auth/login")

    .send({
      email: "ruhon@test.com",

      password: "Password@123",
    });

  token =
    login.body.data.accessToken;

  // Create Turf

  const turf = await request(app)

    .post("/api/v1/turfs")

    .set(
      "Authorization",
      `Bearer ${token}`
    )

    .send({
      name: "Green Valley Turf",

      description:
        "Premium Turf",

      sportType:
        "football",

      pricePerHour: 1000,

      address: {
        state: "Assam",

        city: "Jorhat",

        area: "Garamur",

        pincode: "785007",
      },
    });

  turfId =
    turf.body.data._id;

  // Create Slot

  const slot = await request(app)

    .post("/api/v1/slots")

    .set(
      "Authorization",
      `Bearer ${token}`
    )

    .send({
      turf: turfId,

      date: "2026-08-15",

      startTime: "18:00",

      endTime: "19:00",

      price: 1000,
    });

  slotId =
    slot.body.data._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();

  await mongoose.connection.close();

  await mongoServer.stop();
});

describe("Booking APIs", () => {

  // ==========================
  // Create Booking
  // ==========================

  describe("POST /api/v1/bookings", () => {

    it("should create booking", async () => {

      const res =
        await request(app)

          .post("/api/v1/bookings")

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            turf: turfId,

            slot: slotId,

            bookingDate:
              "2026-08-15",

          });

      expect(res.statusCode)
        .toBe(201);

      expect(res.body.success)
        .toBe(true);

      bookingId =
        res.body.data._id;

    });

  });

  // ==========================
  // Prevent Duplicate Booking
  // ==========================

  describe("Duplicate Booking", () => {

    it("should reject duplicate booking", async () => {

      const res =
        await request(app)

          .post("/api/v1/bookings")

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            turf: turfId,

            slot: slotId,

            bookingDate:
              "2026-08-15",

          });

      expect(res.statusCode)
        .toBe(400);

    });

  });

  // ==========================
  // My Bookings
  // ==========================

  describe("GET /api/v1/bookings/my", () => {

    it("should return user bookings", async () => {

      const res =
        await request(app)

          .get("/api/v1/bookings/my")

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ==========================
  // Booking Details
  // ==========================

  describe("GET /api/v1/bookings/:id", () => {

    it("should return booking", async () => {

      const res =
        await request(app)

          .get(
            `/api/v1/bookings/${bookingId}`
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ==========================
  // Cancel Booking
  // ==========================

  describe("PATCH Cancel", () => {

    it("should cancel booking", async () => {

      const res =
        await request(app)

          .patch(
            `/api/v1/bookings/${bookingId}/cancel`
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            reason:
              "Plan Changed",

          });

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ==========================
  // Booking Statistics
  // ==========================

  describe("GET Statistics", () => {

    it("should return booking stats", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/bookings/statistics"
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