const mongoSanitize = require("express-mongo-sanitize");

// ==========================================
// MongoDB Injection Protection
// ==========================================

// ==========================================
// Express 5 Compatible Mongo Sanitizer
// ==========================================

function sanitize(value) {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      const cleanKey = key.replace(/^\$+/, "").replace(/\./g, "");

      if (cleanKey !== key) {
        value[cleanKey] = sanitize(value[key]);
        delete value[key];
      } else {
        value[key] = sanitize(value[key]);
      }
    }
  }

  return value;
}

module.exports = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    sanitize(req.body);
  }

  if (req.params && typeof req.params === "object") {
    sanitize(req.params);
  }

  // Express 5 exposes req.query as a getter.
  // Mutate the object instead of assigning a new one.
  if (req.query && typeof req.query === "object") {
    sanitize(req.query);
  }

  next();
};