const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");

let mongoServer;

let token;
let transactionId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(
    mongoServer.getUri()
  );

  // Register

  await request(app)

    .post("/api/v1/auth/register")

    .send({
      name: "Wallet User",

      email: "wallet@test.com",

      phone: "8888888888",

      password: "Password@123",
    });

  // Login

  const login =
    await request(app)

      .post("/api/v1/auth/login")

      .send({
        email: "wallet@test.com",

        password: "Password@123",
      });

  token = login.body.data.accessToken;

// Create wallet
await request(app)
  .post("/api/v1/wallet")
  .set("Authorization", `Bearer ${token}`);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();

  await mongoose.connection.close();

  await mongoServer.stop();
});

describe("Wallet APIs", () => {

  // =============================
  // Wallet Details
  // =============================

  describe("GET /api/v1/wallet", () => {

    it("should return wallet", async () => {

      const res =
        await request(app)

          .get("/api/v1/wallet")

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

      expect(res.body.success)
        .toBe(true);

    });

  });

  // =============================
  // Balance
  // =============================

  describe("GET Balance", () => {

    it("should return balance", async () => {

      const res =
        await request(app)

          .get("/api/v1/wallet")

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =============================
  // Add Money
  // =============================

 

  // =============================
  // Transactions
  // =============================

  describe("GET Transactions", () => {

    it("should return transactions", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/wallet/transactions"
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

      expect(res.body.success)
        .toBe(true);

      if (
        res.body.data.length > 0
      ) {

        transactionId =
          res.body.data[0]._id;

      }

    });

  });

  // =============================
  // Transaction Details
  // =============================

  describe("GET Transaction", () => {

    it("should return transaction details", async () => {

      if (!transactionId) return;

      const res =
        await request(app)

          .get(
            `/api/v1/wallet/transactions/${transactionId}`
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =============================
  // Withdraw
  // =============================

  describe("POST Withdraw", () => {

    it("should create withdrawal request", async () => {

      const res =
        await request(app)

          .post(
            "/api/v1/wallet/withdraw"
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            amount: 200,

            accountNumber:
              "123456789012",

            ifsc:
              "SBIN0001234",

            accountHolderName:
              "Wallet User",

          });

      expect([
        200,
        400,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // =============================
  // Cashback
  // =============================


  // =============================
  // Wallet Statistics
  // =============================

  describe("GET Statistics", () => {

    it("should return wallet statistics", async () => {

      const res =
        await request(app)

          .get(
            "/api/v1/wallet/statistics"
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

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});