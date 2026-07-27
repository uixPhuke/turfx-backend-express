const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");


jest.mock("../src/config/cloudinary", () => ({
  uploadToCloudinary: jest.fn(async () => ({
    public_id: "test_public_id",
    secure_url: "https://example.com/test.jpg",
    url: "https://example.com/test.jpg",
  })),
  deleteFromCloudinary: jest.fn(async () => ({
    result: "ok",
  })),
}));


const app = require("../src/app");
const User = require("../src/modules/user/user.model");
const Slot = require("../src/modules/slot/slot.model");
const Turf = require("../src/modules/turf/turf.model");

let mongoServer;

let accessToken;
let turfId;
let slotId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());

  // =====================================
  // Register Owner
  // =====================================

  await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Owner",
      email: "owner@test.com",
      phone: "9999999999",
      password: "Password@123",
    });

  // =====================================
  // Promote to Owner
  // =====================================

  await User.updateOne(
    { email: "owner@test.com" },
    {
      role: "owner",
      "ownerDetails.isApproved": true,
    }
  );

  // =====================================
  // Login
  // =====================================

  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: "owner@test.com",
      password: "Password@123",
    });

  accessToken = login.body.data.accessToken;

  // =====================================
  // Create Turf
  // =====================================

  const turf = await request(app)
    .post("/api/v1/turfs")
    .set("Authorization", `Bearer ${accessToken}`)
    .field("name", "Green Valley Turf")
    .field(
      "description",
      "Premium Football Turf with international quality ground."
    )
    .field("sports[]", "football")
    .field("pricing[weekday]", "1200")
    .field("pricing[weekend]", "1500")
    .field("contact[phone]", "9999999999")
    .field("address[state]", "Assam")
    .field("address[city]", "Jorhat")
    .field("address[area]", "Garamur")
    .field("address[pincode]", "785007")
    .field(
      "address[fullAddress]",
      "Garamur, Jorhat, Assam"
    )
    .field("location[coordinates][0]", "94.2037")
    .field("location[coordinates][1]", "26.7509")
    .attach(
      "images",
      path.join(__dirname, "fixtures", "turf.png")
    );

  expect(turf.statusCode).toBe(201);

  console.log("STATUS:", turf.statusCode);
console.log("BODY:", JSON.stringify(turf.body, null, 2));

turfId = turf.body.data._id;

// Approve the turf for testing
await Turf.findByIdAndUpdate(turfId, {
  isApproved: true,
  isVerified: true,
});

  // =====================================
  // Create Blocked Slot
  // =====================================

  const slot = await request(app)
    .post("/api/v1/slots/block")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      turf: turfId,
      bookingDate: "2026-08-10",
      startTime: "18:00",
      endTime: "19:00",
      reason: "Maintenance",
    });

  expect(slot.statusCode).toBe(201);

  slotId = slot.body.data._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("Slot APIs", () => {

  // =====================================
  // Available Slots
  // =====================================

  describe("GET /api/v1/slots/available", () => {

    it("should return available slots", async () => {

      const res = await request(app)
        .get("/api/v1/slots/available")
        .query({
          turf: turfId,
          date: "2026-08-10",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

  // =====================================
  // Get Slots By Turf
  // =====================================

  describe("GET /api/v1/slots/turf/:turfId", () => {

    it("should return turf slots", async () => {

      const res = await request(app)
        .get(`/api/v1/slots/turf/${turfId}`)
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });
    // =====================================
  // Get Slots By Date
  // =====================================

  describe("GET /api/v1/slots/turf/:turfId/date", () => {

    it("should return slots by date", async () => {

      const res = await request(app)
        .get(`/api/v1/slots/turf/${turfId}/date`)
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )
        .query({
          date: "2026-08-10",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

  // =====================================
  // Get Owner Slots
  // =====================================

  describe("GET /api/v1/slots/mine", () => {

    it("should return owner slots", async () => {

      const res = await request(app)
        .get("/api/v1/slots/mine")
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

  // =====================================
  // Unblock Slot
  // =====================================

  describe("DELETE /api/v1/slots/:id/unblock", () => {

    it("should unblock slot", async () => {

      const res = await request(app)
        .delete(`/api/v1/slots/${slotId}/unblock`)
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

  // =====================================
  // Mark Maintenance
  // =====================================

  describe("POST /api/v1/slots/maintenance", () => {

    it("should create maintenance slot", async () => {

      const res = await request(app)
        .post("/api/v1/slots/maintenance")
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )
        .send({
          turf: turfId,
          bookingDate: "2026-08-11",
          startTime: "10:00",
          endTime: "11:00",
          reason: "Ground Maintenance",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);

      slotId = res.body.data._id;

    });

  });

  // =====================================
  // Remove Maintenance
  // =====================================

  describe("DELETE /api/v1/slots/maintenance/:id", () => {

    it("should remove maintenance slot", async () => {

      const res = await request(app)
        .delete(`/api/v1/slots/maintenance/${slotId}`)
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

  // =====================================
  // Slot Statistics
  // =====================================

  describe("GET /api/v1/slots/statistics", () => {

    it("should return slot statistics", async () => {

      const res = await request(app)
        .get("/api/v1/slots/statistics")
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

});