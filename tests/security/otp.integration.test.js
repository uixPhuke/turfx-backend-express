const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../../src/modules/user/user.model");
const Otp = require("../../src/modules/auth/otp.model");
const auth = require("../../src/modules/auth/auth.service");
const { hashOTP } = require("../../src/utils/otpSecret");
let mongo, user;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  user = await User.create({
    name: "OTP Fixture",
    email: "otp@example.test",
    phone: "9999999999",
    password: "Original@123",
  });
});
beforeEach(async () => {
  await Otp.deleteMany({});
});
afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
const challenge = (purpose) =>
  Otp.create({
    user: user._id,
    email: user.email,
    purpose,
    otp: hashOTP("123456"),
    expiresAt: new Date(Date.now() + 60000),
  });
it("stores a secret digest and consumes email verification only once", async () => {
  const row = await challenge("EMAIL_VERIFICATION");
  expect(row.otp).not.toBe("123456");
  await expect(auth.verifyEmail(user.email, "123456")).resolves.toHaveProperty(
    "message",
  );
  await expect(auth.verifyEmail(user.email, "123456")).rejects.toMatchObject({
    statusCode: 400,
  });
  expect(await Otp.countDocuments({ user: user._id })).toBe(0);
});
it("enforces the attempt limit even when the correct code is submitted after five failures", async () => {
  await challenge("EMAIL_VERIFICATION");
  for (let attempt = 0; attempt < 5; attempt++) {
    await expect(auth.verifyEmail(user.email, "000000")).rejects.toMatchObject({
      statusCode: 400,
    });
  }
  await expect(auth.verifyEmail(user.email, "123456")).rejects.toMatchObject({
    statusCode: 400,
  });
});
it("consumes a verified password reset and revokes existing sessions", async () => {
  await challenge("FORGOT_PASSWORD");
  await auth.verifyOtp(user.email, "123456", "FORGOT_PASSWORD");
  await auth.resetPassword(user.email, "123456", "Changed@123");
  const changed = await User.findById(user._id).select(
    "+password +refreshToken",
  );
  expect(await changed.comparePassword("Changed@123")).toBe(true);
  expect(changed.tokenVersion).toBe(1);
  expect(changed.refreshToken).toBeNull();
  await expect(
    auth.resetPassword(user.email, "123456", "Again@123"),
  ).rejects.toMatchObject({ statusCode: 400 });
});
it("cannot verify a challenge for a different purpose", async () => {
  await challenge("EMAIL_VERIFICATION");
  await expect(
    auth.verifyOtp(user.email, "123456", "FORGOT_PASSWORD"),
  ).rejects.toMatchObject({ statusCode: 400 });
});
