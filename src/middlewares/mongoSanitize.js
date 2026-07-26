const mongoSanitize = require("express-mongo-sanitize");

// ==========================================
// MongoDB Injection Protection
// ==========================================

const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: "_",

  onSanitize: ({ req, key }) => {
    console.warn(
      `[MongoSanitize] Sanitized key "${key}" from ${req.method} ${req.originalUrl}`
    );
  },
});

module.exports = mongoSanitizeMiddleware;