const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");

let mongoServer;
let accessToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(
    mongoServer.getUri()
  );

  // Register User
  await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Ruhon Borah",
      email: "ruhon@test.com",
      phone: "9876543210",
      password: "Password@123",
    });

  // Login
  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: "ruhon@test.com",
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

describe("User APIs", () => {

  // ==========================
  // Get Profile
  // ==========================

  describe("GET /api/v1/users/me", () => {

    it("should return logged in user", async () => {

      const res = await request(app)

        .get("/api/v1/users/me")

        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

      expect(res.body.data.email)
        .toBe("ruhon@test.com");

    });

  });

  // ==========================
  // Update Profile
  // ==========================

  describe("PATCH /api/v1/users/profile", () => {

    it("should update profile", async () => {

      const res = await request(app)

        .patch("/api/v1/users/profile")

        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )

        .send({

          name: "Ruhon Updated",

          gender: "male",

        });

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

    });

  });

  // ==========================
  // Change Password
  // ==========================

  describe("PATCH /api/v1/users/change-password", () => {

    it("should change password", async () => {

      const res = await request(app)

        .patch("/api/v1/users/change-password")

        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )

        .send({

          currentPassword:
            "Password@123",

          newPassword:
            "NewPassword@123",

        });

      expect(res.statusCode).toBe(200);

    });

  });

  // ==========================
  // Update Address
  // ==========================

  describe("PATCH /api/v1/users/address", () => {

    it("should update address", async () => {

      const res = await request(app)

        .patch("/api/v1/users/address")

        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )

        .send({

          state: "Assam",

          city: "Jorhat",

          area: "Garamur",

          pincode: "785007",

        });

      expect(res.statusCode).toBe(200);

    });

  });

  // ==========================
  // Owner Application
  // ==========================

  describe("POST /api/v1/users/owner/apply", () => {

    it("should submit owner application", async () => {

      const res = await request(app)

        .post("/api/v1/users/owner/apply")

        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )

        .send({

          businessName:
            "Ruhon Sports Arena",

          gstNumber:
            "22AAAAA0000A1Z5",

          panNumber:
            "ABCDE1234F",

        });

      expect(res.statusCode).toBe(200);

    });

  });

  // ==========================
  // Owner Status
  // ==========================

  describe("GET /api/v1/users/owner/status", () => {

    it("should get owner application status", async () => {

      const res = await request(app)

        .get("/api/v1/users/owner/status")

        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(res.statusCode).toBe(200);

    });

  });

  // ==========================
  // Delete Account
  // ==========================

  describe("DELETE /api/v1/users/delete-account", () => {

    it("should delete account", async () => {

      const res = await request(app)

        .delete(
          "/api/v1/users/delete-account"
        )

        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(res.statusCode).toBe(200);

    });

  });

});