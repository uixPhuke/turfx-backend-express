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


describe("User APIs", () => {

  // ==========================
  // Get Profile
  // ==========================

  describe("GET /api/v1/users/me", () => {

    it("should return logged in user", async () => {

      const res = await request(app)

        .get("/api/v1/users/profile")

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

      .patch("/api/v1/users/update-profile")

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

 

});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  if (mongoServer) {
    await mongoServer.stop();
  }
});