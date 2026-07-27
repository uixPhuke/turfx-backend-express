module.exports = {
  uploadToCloudinary: jest.fn(async () => ({
    public_id: "test_public_id",
    secure_url: "https://example.com/test.jpg",
    url: "https://example.com/test.jpg",
  })),

  deleteFromCloudinary: jest.fn(async () => ({
    result: "ok",
  })),
};