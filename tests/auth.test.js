const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");

const User = require("../src/modules/user/user.model");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(
    mongoServer.getUri()
  );
});

afterEach(async () => {
  await User.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Authentication APIs", () => {

  // ================================
  // Register
  // ================================

  describe("POST /api/v1/auth/register", () => {

    it("should register a new user", async () => {

      const res = await request(app)

        .post("/api/v1/auth/register")

        .send({

          name: "Ruhon Borah",

          email: "ruhon@test.com",

          phone: "9876543210",

          password: "Password@123",

        });

      expect(res.statusCode).toBe(201);

      expect(res.body.success).toBe(true);

    });

    it("should not register duplicate email", async () => {

      await User.create({

        name: "Test",

        email: "ruhon@test.com",

        phone: "9999999999",

        password: "Password@123",

      });

      const res = await request(app)

        .post("/api/v1/auth/register")

        .send({

          name: "Another",

          email: "ruhon@test.com",

          phone: "8888888888",

          password: "Password@123",

        });

      expect(res.statusCode).toBe(409);

    });

  });

  // ================================
  // Login
  // ================================

  describe("POST /api/v1/auth/login", () => {

    beforeEach(async () => {

      const user = new User({

        name: "Ruhon",

        email: "login@test.com",

        phone: "9999999999",

        password: "Password@123",

      });

      await user.save();

    });

    it("should login successfully", async () => {

      const res = await request(app)

        .post("/api/v1/auth/login")

        .send({

          email: "login@test.com",

          password: "Password@123",

        });

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

      expect(res.body.data).toHaveProperty("accessToken");

    });

    it("should reject invalid password", async () => {

      const res = await request(app)

        .post("/api/v1/auth/login")

        .send({

          email: "login@test.com",

          password: "WrongPassword",

        });

      expect(res.statusCode).toBe(401);

    });

  });

  // ================================
  // Profile
  // ================================

  describe("GET /api/v1/users/me", () => {

    let token;

    beforeEach(async () => {

      await request(app)

        .post("/api/v1/auth/register")

        .send({

          name: "Ruhon",

          email: "profile@test.com",

          phone: "8888888888",

          password: "Password@123",

        });

      const login = await request(app)

        .post("/api/v1/auth/login")

        .send({

          email: "profile@test.com",

          password: "Password@123",

        });

      token =
        login.body.data.accessToken;

    });

    it("should return profile", async () => {

      const res = await request(app)

        .get("/api/v1/users/me")

        .set(

          "Authorization",

          `Bearer ${token}`

        );

      expect(res.statusCode).toBe(200);

      expect(res.body.success).toBe(true);

    });

    it("should reject without token", async () => {

      const res = await request(app)

        .get("/api/v1/users/me");

      expect(res.statusCode).toBe(401);

    });

  });

  // ================================
  // Refresh Token
  // ================================

  describe("POST /api/v1/auth/refresh-token", () => {

    it("should reject invalid token", async () => {

      const res = await request(app)

        .post("/api/v1/auth/refresh-token")

        .send({

          refreshToken: "invalid",

        });

      expect(res.statusCode).toBe(401);

    });

  });

  // ================================
  // Logout
  // ================================

  describe("POST /api/v1/auth/logout", () => {

    it("should require authentication", async () => {

      const res = await request(app)

        .post("/api/v1/auth/logout");

      expect(res.statusCode).toBe(401);

    });

  });

});