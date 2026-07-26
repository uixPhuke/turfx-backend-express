const express = require("express");

// Create Express App
const app = express();

// ==============================
// Middlewares
// ==============================

const helmetMiddleware = require("./middlewares/helmet");
const corsMiddleware = require("./middlewares/cors");
const compressionMiddleware = require("./middlewares/compression");
const mongoSanitizeMiddleware = require("./middlewares/mongoSanitize");
const xssMiddleware = require("./middlewares/xss");
const hppMiddleware = require("./middlewares/hpp");

const {
  apiLimiter,
} = require("./middlewares/rateLimiter");

const {
  requestLogger,
} = require("./middlewares/requestLogger");

// ==============================
// Routes & Docs
// ==============================

const routes = require("./routes"); // <-- Change if your routes file is elsewhere
const swaggerDocs = require("./docs/swagger");

// ==============================
// Error Middlewares
// ==============================

const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");

// ==============================
// Security Middlewares
// ==============================

app.disable("x-powered-by");

app.use(requestLogger);

app.use(helmetMiddleware);

app.use(corsMiddleware);

app.use(compressionMiddleware);

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.use(mongoSanitizeMiddleware);

app.use(xssMiddleware);

app.use(hppMiddleware);

app.use(apiLimiter);

// ==============================
// Swagger
// ==============================

swaggerDocs(app);

// ==============================
// Home Route
// ==============================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to TurfX API",
  });
});

// ==============================
// API Routes
// ==============================

app.use("/api/v1", routes);

// ==============================
// 404 Handler
// ==============================

app.use(notFound);

// ==============================
// Global Error Handler
// ==============================

app.use(errorHandler);

module.exports = app;