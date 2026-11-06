jest.mock("../../src/modules/user/user.model", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findById: jest.fn(),
}));
jest.mock("../../src/modules/auth/otp.model", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  updateOne: jest.fn(),
}));
const User = require("../../src/modules/user/user.model");
const Otp = require("../../src/modules/auth/otp.model");
const {
  generateRefreshToken,
  hashToken,
} = require("../../src/utils/generateToken");
const auth = require("../../src/modules/auth/auth.service");
beforeEach(() => jest.clearAllMocks());
it("rotates refresh tokens through a hashed compare-and-swap", async () => {
  const token = generateRefreshToken({ id: "user-1" });
  User.findOneAndUpdate.mockResolvedValue({
    _id: "user-1",
    role: "user",
    tokenVersion: 2,
  });
  const result = await auth.refreshAccessToken(token);
  expect(result.refreshToken).not.toBe(token);
  expect(User.findOneAndUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      refreshToken: hashToken(token),
      isDeleted: false,
      isBlocked: false,
    }),
    expect.objectContaining({
      $set: { refreshToken: hashToken(result.refreshToken) },
    }),
    { new: true },
  );
});
it("rejects a reused/revoked refresh token", async () => {
  User.findOneAndUpdate.mockResolvedValue(null);
  await expect(
    auth.refreshAccessToken(generateRefreshToken({ id: "user-1" })),
  ).rejects.toMatchObject({ statusCode: 401 });
});
it("selects the hidden OTP field when verifying email", async () => {
  const user = { save: jest.fn().mockResolvedValue() };
  User.findOne.mockResolvedValue(user);
  const select = jest
    .fn()
    .mockResolvedValue({
      otp: require("../../src/utils/otpSecret").hashOTP("123456"),
      expiresAt: new Date(Date.now() + 60000),
      deleteOne: jest.fn(),
    });
  Otp.findOneAndUpdate.mockReturnValue({ select });
  Otp.findOneAndDelete.mockResolvedValue({ _id: "fixture" });
  await auth.verifyEmail("fixture@example.test", "123456");
  expect(select).toHaveBeenCalledWith("+otp");
  expect(user.isVerified).toBe(true);
});
