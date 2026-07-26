require("dotenv").config({
  path: ".env.test",
});

module.exports = {
  testEnvironment: "node",

  testMatch: [
    "**/tests/**/*.test.js",
  ],

  verbose: true,

  forceExit: true,

  setupFiles: [
    "dotenv/config",
  ],
};