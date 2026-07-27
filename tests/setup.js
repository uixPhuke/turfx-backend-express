const dotenv = require("dotenv");

const result = dotenv.config({ path: ".env.test" });

console.log("DOTENV RESULT:", result);

console.log("JWT_SECRET:", process.env.JWT_SECRET);
jest.mock("../src/utils/sendEmail", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  verifyMailConnection: jest.fn(),
}));

jest.setTimeout(30000);
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