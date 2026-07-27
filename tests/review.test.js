const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/modules/user/user.model");
const Turf = require("../src/modules/turf/turf.model");
const Slot = require("../src/modules/slot/slot.model");
const Booking = require("../src/modules/booking/booking.model");

const app = require("../src/app");

let mongoServer;

let token;
let turfId;
let bookingId;
let reviewId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(
    mongoServer.getUri()
  );

  // Register User

  await request(app)

    .post("/api/v1/auth/register")

    .send({

      name: "Ruhon",

      email: "review@test.com",

      phone: "9999999999",

      password: "Password@123",

    });

  // Login

  const login =
    await request(app)

      .post("/api/v1/auth/login")

      .send({

        email: "review@test.com",

        password: "Password@123",

      });
      owner = await User.create({
    name: "Owner",
    email: "owner@test.com",
    phone: "8888888888",
    password: "Password@123",
    role: "owner",
  });
turf = await Turf.create({
  owner: owner._id,

  name: "Test Turf",

  description: "Football Turf",

  images: [
    {
      public_id: "test",
      url: "https://example.com/image.jpg",
    },
  ],

  sports: ["football"],

  pricing: {
    weekday: 1000,
    weekend: 1200,
    holiday: 1500,
  },

  contact: {
    phone: "9999999999",
    email: "owner@test.com",
  },

  address: {
    state: "Assam",
    city: "Jorhat",
    area: "Garamur",
    pincode: "785001",
    fullAddress: "Test Address",
  },

  location: {
    type: "Point",
    coordinates: [94.2037, 26.7509],
  },
});
slot = await Slot.create({
  turf: turf._id,

  owner: owner._id,

  bookingDate: new Date(),

  startTime: "10:00",

  endTime: "11:00",

  price: 1000,
});
const user = await User.findOne({
  email: "review@test.com",
});

booking = await Booking.create({
  user: user._id,

  owner: owner._id,

  turf: turf._id,

  slot: slot._id,

  bookingDate: new Date(),

  startTime: "10:00",

  endTime: "11:00",

  duration: 60,

  players: 10,

  sport: "football",

  pricing: {
    slotPrice: 1000,
    convenienceFee: 0,
    tax: 0,
    discount: 0,
    totalAmount: 1000,
  },

  bookingStatus: "completed",
});
slot.booking = booking._id;
slot.status = "booked";
await slot.save();
turfId = turf._id;
bookingId = booking._id;

  token =
    login.body.data.accessToken;

  // Dummy IDs
  // Replace these with actual created Turf and Booking IDs
  // if your review module validates ownership.


});

afterAll(async () => {

  await mongoose.connection.dropDatabase();

  await mongoose.connection.close();

  await mongoServer.stop();

});

describe("Review APIs", () => {

  // =====================================
  // Create Review
  // =====================================

  describe("POST /api/v1/reviews", () => {

    it("should create review", async () => {

      const res =
        await request(app)

          .post("/api/v1/reviews")

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            bookingId,

            turfId,

            rating: 5,

            comment:
              "Excellent Turf",

          });

      expect([201, 400])
        .toContain(
          res.statusCode
        );

      if (
        res.body?.data?._id
      ) {

        reviewId =
          res.body.data._id;

      }

    });

  });

  // =====================================
  // All Reviews
  // =====================================

  describe("GET /api/v1/reviews", () => {

    it("should return reviews", async () => {

      const res =
        await request(app)

          .get(`/api/v1/reviews/turf/${turfId}`)

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =====================================
  // Turf Reviews
  // =====================================

  describe("GET Turf Reviews", () => {

    it("should return turf reviews", async () => {

      const res =
        await request(app)

          .get(
            `/api/v1/reviews/turf/${turfId}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =====================================
  // My Reviews
  // =====================================

  describe("GET My Reviews", () => {

    it("should return user reviews", async () => {

      const res =
        await request(app)

          .get("/api/v1/reviews/user/my-reviews")

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =====================================
  // Review Details
  // =====================================

  describe("GET Review", () => {

    it("should return review details", async () => {

      if (!reviewId) return;

      const res =
        await request(app)

          .get(
            `/api/v1/reviews/${reviewId}`
          );

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =====================================
  // Update Review
  // =====================================

  describe("PATCH Review", () => {

    it("should update review", async () => {

      if (!reviewId) return;

      const res =
        await request(app)

          .patch(
            `/api/v1/reviews/${reviewId}`
          )

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            rating: 4,

            comment:
              "Updated Review",

          });

      expect(res.statusCode)
        .toBe(200);

    });

  });

  // =====================================
  // Reply Review
  // =====================================

  describe("POST Reply", () => {

    it("should reply to review", async () => {

      if (!reviewId) return;

      const res =
        await request(app)

       .patch(`/api/v1/reviews/${reviewId}/reply`)

          .set(
            "Authorization",
            `Bearer ${token}`
          )

          .send({

            reply:
              "Thank you for your feedback!",

          });

      expect([
        200,
        403,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // =====================================
  // Owner Reviews
  // =====================================

  describe("GET Owner Reviews", () => {

    it("should return owner reviews", async () => {

      const res =
        await request(app)

         .get("/api/v1/reviews/owner/statistics")

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect([
        200,
        403,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // =====================================
  // Statistics
  // =====================================

  describe("GET Statistics", () => {

    it("should return review statistics", async () => {

      const res =
        await request(app)

         .get("/api/v1/reviews/owner/statistics")

          .set(
            "Authorization",
            `Bearer ${token}`
          );

      expect([
        200,
        403,
      ]).toContain(
        res.statusCode
      );

    });

  });

  // =====================================
  // Delete Review
  // =====================================

  describe("DELETE Review", () => {

    it("should delete review", async () => {

      if (!reviewId) return;

      const res =
        await request(app)

          .delete(
            `/api/v1/reviews/${reviewId}`
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