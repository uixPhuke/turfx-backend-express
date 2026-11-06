// All tests use synthetic credentials and disposable database instances.
// Never load developer or deployed environment files into test processes.
Object.assign(process.env, {
  NODE_ENV: "test", JWT_SECRET: "playza-test-access-secret-not-for-production",
  REFRESH_TOKEN_SECRET: "playza-test-refresh-secret-not-for-production",
  JWT_EXPIRE: "15m", REFRESH_TOKEN_EXPIRE: "7d",
  RAZORPAY_KEY_ID: "rzp_test_fixture", RAZORPAY_KEY_SECRET: "playza-test-payment-secret",
  RAZORPAY_WEBHOOK_SECRET: "playza-test-webhook-secret", LOG_LEVEL: "silent",
});

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