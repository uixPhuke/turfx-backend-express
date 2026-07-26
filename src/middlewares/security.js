const helmetMiddleware = require("./helmet");
const corsMiddleware = require("./cors");
const compressionMiddleware = require("./compression");
const mongoSanitizeMiddleware = require("./mongoSanitize");
const xssMiddleware = require("./xss");
const hppMiddleware = require("./hpp");

const {
  apiLimiter,
} = require("./rateLimiter");

const {
  requestLogger,
} = require("./requestLogger");

// ==========================================
// Production Security Stack
// ==========================================

const security = (app) => {
  // Hide Express Signature
  app.disable("x-powered-by");

  // ----------------------------------------
  // HTTP Security Headers
  // ----------------------------------------

  app.use(helmetMiddleware);

  // ----------------------------------------
  // CORS
  // ----------------------------------------

  app.use(corsMiddleware);

  // ----------------------------------------
  // Compress Responses
  // ----------------------------------------

  app.use(compressionMiddleware);

  // ----------------------------------------
  // Request Logger
  // ----------------------------------------

  app.use(requestLogger);

  // ----------------------------------------
  // Body Parser
  // ----------------------------------------

  app.use(
    require("express").json({
      limit: "10mb",
    })
  );

  app.use(
    require("express").urlencoded({
      extended: true,
      limit: "10mb",
    })
  );

  // ----------------------------------------
  // MongoDB Injection Protection
  // ----------------------------------------

  app.use(mongoSanitizeMiddleware);

  // ----------------------------------------
  // XSS Protection
  // ----------------------------------------

  app.use(xssMiddleware);

  // ----------------------------------------
  // HTTP Parameter Pollution
  // ----------------------------------------

  app.use(hppMiddleware);

  // ----------------------------------------
  // Global Rate Limiter
  // ----------------------------------------

  app.use(apiLimiter);
};

module.exports = security;