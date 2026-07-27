const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");

const Admin = require("../src/modules/admin/admin.model");
const User = require("../src/modules/user/user.model");

let mongoServer;

let adminToken;
let ownerId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());

  // ======================================
  // Create Super Admin
  // ======================================

  await Admin.create({
    name: "Super Admin",
    email: "admin@turfx.com",
    password: "Admin@123",
    role: "super_admin",
    isActive: true,
    isDeleted: false,
  });

  // ======================================
  // Create Owner
  // ======================================

  const owner = await User.create({
    name: "Test Owner",
    email: "owner@test.com",
    phone: "9999999999",
    password: "Password@123",
    role: "owner",
    ownerDetails: {
      businessName: "Green Valley Turf",
      isApproved: false,
    },
  });

  ownerId = owner._id;

  // ======================================
  // Admin Login
  // ======================================

  const login = await request(app)
    .post("/api/v1/admin/login")
    .send({
      email: "admin@turfx.com",
      password: "Admin@123",
    });

  expect(login.statusCode).toBe(200);

  adminToken = login.body.data.accessToken;
});



describe("Admin APIs", () => {

  // ======================================
  // Dashboard Statistics
  // ======================================

  describe("GET Dashboard Statistics", () => {

   it("should return recent activities", async () => {
  const res = await request(app)
    .get("/api/v1/admin/activities")
    .set("Authorization", `Bearer ${adminToken}`);

  console.log("STATUS:", res.statusCode);
  console.log("BODY:", JSON.stringify(res.body, null, 2));

  expect(res.statusCode).toBe(200);
});

  });

  // ======================================
  // Get All Users
  // ======================================

  describe("GET All Users", () => {

    it("should return all users", async () => {

      const res = await request(app)
        .get("/api/v1/admin/users/all")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });
    // ======================================
  // Block User
  // ======================================

  describe("PATCH Block User", () => {

    it("should block user", async () => {

      const res = await request(app)
        .patch(`/api/v1/admin/users/${ownerId}/block`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          reason: "Spam Activity",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

  // ======================================
  // Unblock User
  // ======================================

  describe("PATCH Unblock User", () => {

    it("should unblock user", async () => {

      const res = await request(app)
        .patch(`/api/v1/admin/users/${ownerId}/unblock`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

  // ======================================
  // Approve Owner
  // ======================================

  describe("PATCH Approve Owner", () => {

    it("should approve owner", async () => {

      const res = await request(app)
        .patch(`/api/v1/admin/owners/${ownerId}/approve`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          remarks: "Verified successfully",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

  // ======================================
  // Reject Owner
  // ======================================

  describe("PATCH Reject Owner", () => {

    it("should reject owner", async () => {

      const res = await request(app)
        .patch(`/api/v1/admin/owners/${ownerId}/reject`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          reason: "Documents not valid",
        });

      expect([200, 400]).toContain(res.statusCode);

    });

  });

  // ======================================
  // Dashboard Revenue
  // ======================================

  describe("GET Dashboard Revenue", () => {

    it("should return revenue analytics", async () => {

      const res = await request(app)
        .get("/api/v1/admin/dashboard/revenue")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

  // ======================================
  // Dashboard Platform
  // ======================================

  describe("GET Dashboard Platform", () => {

    it("should return platform analytics", async () => {

      const res = await request(app)
        .get("/api/v1/admin/dashboard/platform")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });
    // ======================================
  // Recent Activities
  // ======================================

  describe("GET Recent Activities", () => {

    it("should return recent activities", async () => {

      const res = await request(app)
        .get("/api/v1/admin/activities")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

  // ======================================
  // Audit Logs
  // ======================================

  describe("GET Audit Logs", () => {

    it("should return audit logs", async () => {

      const res = await request(app)
        .get("/api/v1/admin/audit-logs")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

  // ======================================
  // System Health
  // ======================================

  describe("GET System Health", () => {

    it("should return system health", async () => {

      const res = await request(app)
        .get("/api/v1/admin/system-health")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

    });

  });

});

// ======================================
// Cleanup
// ======================================

afterAll(async () => {

  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }

});