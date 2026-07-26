const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");

let mongoServer;
let accessToken;
let turfId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(
    mongoServer.getUri()
  );

  // Register Owner
  await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Owner",
      email: "owner@test.com",
      phone: "9999999999",
      password: "Password@123",
    });

  // Login
  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: "owner@test.com",
      password: "Password@123",
    });

  accessToken =
    login.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Turf APIs", () => {

  // ==========================
  // Create Turf
  // ==========================

  describe("POST /api/v1/turfs", () => {

    it("should create turf", async () => {

      const res = await request(app)

        .post("/api/v1/turfs")

        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )

        .field(
          "name",
          "Green Valley Turf"
        )

        .field(
          "description",
          "Premium football turf"
        )

        .field(
          "sportType",
          "football"
        )

        .field(
          "pricePerHour",
          1200
        )

        .field(
          "size",
          "7A Side"
        )

        .field(
          "address[state]",
          "Assam"
        )

        .field(
          "address[city]",
          "Jorhat"
        )

        .field(
          "address[area]",
          "Garamur"
        )

        .field(
          "address[pincode]",
          "785007"
        );

      expect(res.statusCode).toBe(201);

      expect(res.body.success).toBe(true);

      turfId =
        res.body.data._id;

    });

  });

  // ==========================
  // Get All Turfs
  // ==========================

  describe("GET /api/v1/turfs", () => {

    it("should return all turfs", async () => {

      const res =
        await request(app)

          .get("/api/v1/turfs");

      expect(res.statusCode)
        .toBe(200);

      expect(res.body.success)
        .toBe(true);

    });

  });

  // ==========================
  // Get Turf
  // ==========================

  describe("GET /api/v1/turfs/:id", () => {

    it("should return turf details", async () => {

      const res =
        await request(app)

          .get(
            `/api/v1/turfs/${turfId}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ==========================
  // Update Turf
  // ==========================

  describe("PATCH /api/v1/turfs/:id", () => {

    it("should update turf", async () => {

      const res =
        await request(app)

          .patch(
            `/api/v1/turfs/${turfId}`
          )

          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )

          .send({

            pricePerHour: 1500,

            description:
              "Updated Description",

          });

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ==========================
  // Owner Turfs
  // ==========================

  describe("GET /api/v1/turfs/my", () => {

    it("should return owner turfs", async () => {

      const res =
        await request(app)

          .get("/api/v1/turfs/my")

          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ==========================
  // Nearby Turfs
  // ==========================

  describe("GET /api/v1/turfs/nearby", () => {

    it("should return nearby turfs", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/turfs/nearby"
          )

          .query({

            latitude: 26.7509,

            longitude: 94.2037,

            radius: 5,

          });

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ==========================
  // Search Turf
  // ==========================

  describe("GET /api/v1/turfs/search", () => {

    it("should search turf", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/turfs/search"
          )

          .query({

            keyword: "football",

          });

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // ==========================
  // Delete Turf
  // ==========================

  describe("DELETE /api/v1/turfs/:id", () => {

    it("should delete turf", async () => {

      const res =
        await request(app)

          .delete(
            `/api/v1/turfs/${turfId}`
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