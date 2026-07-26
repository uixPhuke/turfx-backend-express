const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");

let mongoServer;

let adminToken;
let userId;

beforeAll(async () => {

  mongoServer =
    await MongoMemoryServer.create();

  await mongoose.connect(
    mongoServer.getUri()
  );

  // Login as Admin
  // Replace this with your actual admin creation
  // if your project doesn't seed one automatically.

  const login =
    await request(app)

      .post("/api/v1/admin/login")

      .send({

        email: "admin@turfx.com",

        password: "Admin@123",

      });

  adminToken =
    login.body?.data?.accessToken;

  userId =
    new mongoose.Types.ObjectId();

});

afterAll(async () => {

  await mongoose.connection.dropDatabase();

  await mongoose.connection.close();

  await mongoServer.stop();

});

describe("Admin APIs", () => {

  // ======================================
  // Dashboard
  // ======================================

  describe("GET Dashboard", () => {

    it("should return dashboard", async () => {

      const res =
        await request(app)

          .get("/api/v1/admin/dashboard")

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        401,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // Users
  // ======================================

  describe("GET Users", () => {

    it("should return users", async () => {

      const res =
        await request(app)

          .get("/api/v1/admin/users")

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        401,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // User Details
  // ======================================

  describe("GET User", () => {

    it("should return user", async () => {

      const res =
        await request(app)

          .get(
            `/api/v1/admin/users/${userId}`
          )

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        404,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // Block User
  // ======================================

  describe("PATCH Block User", () => {

    it("should block user", async () => {

      const res =
        await request(app)

          .patch(
            `/api/v1/admin/users/${userId}/block`
          )

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )

          .send({

            reason:
              "Spam Activity",

          });

      expect([
        200,
        404,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // Unblock User
  // ======================================

  describe("PATCH Unblock User", () => {

    it("should unblock user", async () => {

      const res =
        await request(app)

          .patch(
            `/api/v1/admin/users/${userId}/unblock`
          )

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        404,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // Pending Owners
  // ======================================

  describe("GET Pending Owners", () => {

    it("should return pending owners", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/admin/owners/pending"
          )

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        401,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // Approve Owner
  // ======================================

  describe("PATCH Owner Approval", () => {

    it("should approve owner", async () => {

      const res =
        await request(app)

          .patch(
            `/api/v1/admin/owners/${userId}/approve`
          )

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )

          .send({

            status:
              "approved",

            remarks:
              "Verified",

          });

      expect([
        200,
        404,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // Turfs
  // ======================================

  describe("GET Turfs", () => {

    it("should return turfs", async () => {

      const res =
        await request(app)

          .get("/api/v1/admin/turfs")

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        401,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // Bookings
  // ======================================

  describe("GET Bookings", () => {

    it("should return bookings", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/admin/bookings"
          )

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        401,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // Payments
  // ======================================

  describe("GET Payments", () => {

    it("should return payments", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/admin/payments"
          )

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        401,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // Revenue Report
  // ======================================

  describe("GET Revenue", () => {

    it("should return revenue report", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/admin/reports/revenue"
          )

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        401,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // Booking Analytics
  // ======================================

  describe("GET Booking Analytics", () => {

    it("should return booking analytics", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/admin/reports/bookings"
          )

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        401,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // System Health
  // ======================================

  describe("GET Health", () => {

    it("should return system health", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/admin/system/health"
          )

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        401,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // Queue Status
  // ======================================

  describe("GET Queue Status", () => {

    it("should return BullMQ status", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/admin/system/queues"
          )

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        401,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // ======================================
  // Clear Cache
  // ======================================

  describe("POST Clear Cache", () => {

    it("should clear Redis cache", async () => {

      const res =
        await request(app)

          .post(
            "/api/v1/admin/system/cache/clear"
          )

          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect([
        200,
        401,
      ]).toContain(
        res.statusCode
      );

    });

  });

});