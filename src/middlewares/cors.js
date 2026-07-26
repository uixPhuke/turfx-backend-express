const cors = require("cors");

// ==========================================
// Allowed Origins
// ==========================================

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// ==========================================
// CORS Configuration
// ==========================================

const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow Postman, mobile apps, server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost in development
    if (
      process.env.NODE_ENV === "development" &&
      (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      )
    ) {
      return callback(null, true);
    }

    // Allow configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error("CORS: Origin not allowed")
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],

  exposedHeaders: [
    "Content-Disposition",
  ],

  optionsSuccessStatus: 204,

  maxAge: 86400, // 24 hours
});

module.exports = corsMiddleware;