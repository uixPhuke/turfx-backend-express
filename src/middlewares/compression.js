const compression = require("compression");

// ==========================================
// Compression Filter
// ==========================================

const shouldCompress = (req, res) => {
  // Skip compression if client requests it
  if (req.headers["x-no-compression"]) {
    return false;
  }

  // Use default compression filter
  return compression.filter(req, res);
};

// ==========================================
// Compression Middleware
// ==========================================

const compressionMiddleware = compression({
  level: 6, // 0-9 (6 is recommended)

  threshold: 1024, // Compress responses >1KB

  filter: shouldCompress,

  memLevel: 8,
});

module.exports = compressionMiddleware;