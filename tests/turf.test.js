const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");
const User = require("../src/modules/user/user.model"); 
const path = require("path");

jest.mock("../src/config/cloudinary", () => ({
  uploadToCloudinary: jest.fn(async () => ({
    public_id: "test_public_id",
    url: "https://example.com/test.jpg",
    secure_url: "https://example.com/test.jpg",
  })),
  deleteFromCloudinary: jest.fn(async () => ({
    result: "ok",
  })),
}));

let mongoServer;
let accessToken;
let turfId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());

  // Register
  await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Owner",
      email: "owner@test.com",
      phone: "9999999999",
      password: "Password@123",
    });

  // Promote to owner
  await User.updateOne(
    { email: "owner@test.com" },
    {
      role: "owner",
      "ownerDetails.isApproved": true,
    }
  );

  // Login
  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: "owner@test.com",
      password: "Password@123",
    });

  console.log(login.body);

  accessToken = login.body.data.accessToken;

  console.log("TOKEN:", accessToken);
});



describe("POST /api/v1/turfs", () => {
  it("should create turf", async () => {

    const res = await request(app)
      .post("/api/v1/turfs")
      .set("Authorization", `Bearer ${accessToken}`)

      .field("name", "Green Valley Turf")
      .field(
        "description",
        "Premium football turf for 7-a-side matches."
      )

      .field("sports", "football")

      .field("pricing[weekday]", "1200")
      .field("pricing[weekend]", "1500")

      .field("contact[phone]", "9999999999")

      .field("address[state]", "Assam")
      .field("address[city]", "Jorhat")
      .field("address[area]", "Garamur")
      .field("address[pincode]", "785007")
      .field("address[fullAddress]", "Garamur, Jorhat, Assam")

      .field("location[type]", "Point")
      .field("location[coordinates][0]", "94.2037")
      .field("location[coordinates][1]", "26.7509")

      .attach(
        "images",
        path.join(__dirname, "fixtures", "turf.png")
      );

    console.log("STATUS:", res.statusCode);
    console.log("BODY:", JSON.stringify(res.body, null, 2));

    expect(res.statusCode).toBe(201);

    turfId = res.body.data._id;
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