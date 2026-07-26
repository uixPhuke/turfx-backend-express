const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");

let mongoServer;

let accessToken;
let turfId;
let slotId;

beforeAll(async () => {
  mongoServer =
    await MongoMemoryServer.create();

  await mongoose.connect(
    mongoServer.getUri()
  );

  // ----------------------------
  // Register Owner
  // ----------------------------

  await request(app)

    .post("/api/v1/auth/register")

    .send({
      name: "Owner",

      email: "owner@test.com",

      phone: "9999999999",

      password: "Password@123",
    });

  // ----------------------------
  // Login
  // ----------------------------

  const login =
    await request(app)

      .post("/api/v1/auth/login")

      .send({
        email: "owner@test.com",

        password: "Password@123",
      });

  accessToken =
    login.body.data.accessToken;

  // ----------------------------
  // Create Turf
  // ----------------------------

  const turf =
    await request(app)

      .post("/api/v1/turfs")

      .set(
        "Authorization",
        `Bearer ${accessToken}`
      )

      .send({
        name: "Green Valley Turf",

        description:
          "Premium Football Turf",

        sportType: "football",

        pricePerHour: 1200,

        address: {
          state: "Assam",

          city: "Jorhat",

          area: "Garamur",

          pincode: "785007",
        },
      });

  turfId =
    turf.body.data._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();

  await mongoose.connection.close();

  await mongoServer.stop();
});

describe("Slot APIs", () => {

  // ======================================
  // Create Slot
  // ======================================

  describe("POST /api/v1/slots", () => {

    it("should create slot", async () => {

      const res =
        await request(app)

          .post("/api/v1/slots")

          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )

          .send({

            turf: turfId,

            date: "2026-08-10",

            startTime: "18:00",

            endTime: "19:00",

            price: 1200,

          });

      expect(res.statusCode)
        .toBe(201);

      expect(res.body.success)
        .toBe(true);

      slotId =
        res.body.data._id;

    });

  });

  // ======================================
  // Get All Slots
  // ======================================

  describe("GET /api/v1/slots", () => {

    it("should return all slots", async () => {

      const res =
        await request(app)

          .get("/api/v1/slots");

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ======================================
  // Get Slot
  // ======================================

  describe("GET /api/v1/slots/:id", () => {

    it("should return slot details", async () => {

      const res =
        await request(app)

          .get(
            `/api/v1/slots/${slotId}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ======================================
  // Update Slot
  // ======================================

  describe("PATCH /api/v1/slots/:id", () => {

    it("should update slot", async () => {

      const res =
        await request(app)

          .patch(
            `/api/v1/slots/${slotId}`
          )

          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )

          .send({

            price: 1500,

            status:
              "available",

          });

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ======================================
  // Available Slots
  // ======================================

  describe("GET /api/v1/slots/available", () => {

    it("should return available slots", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/slots/available"
          )

          .query({

            turf: turfId,

            date: "2026-08-10",

          });

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ======================================
  // Block Slot
  // ======================================

  describe("PATCH /api/v1/slots/block/:id", () => {

    it("should block slot", async () => {

      const res =
        await request(app)

          .patch(
            `/api/v1/slots/block/${slotId}`
          )

          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ======================================
  // Unblock Slot
  // ======================================

  describe("PATCH /api/v1/slots/unblock/:id", () => {

    it("should unblock slot", async () => {

      const res =
        await request(app)

          .patch(
            `/api/v1/slots/unblock/${slotId}`
          )

          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ======================================
  // Delete Slot
  // ======================================

  describe("DELETE /api/v1/slots/:id", () => {

    it("should delete slot", async () => {

      const res =
        await request(app)

          .delete(
            `/api/v1/slots/${slotId}`
          )

          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

});