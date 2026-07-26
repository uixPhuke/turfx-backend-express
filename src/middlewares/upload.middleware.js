const multer = require("multer");
const path = require("path");

// ==============================
// Allowed Image Types
// ==============================

const allowedTypes = /jpeg|jpg|png|webp/;

// ==============================
// File Filter
// ==============================

const fileFilter = (req, file, cb) => {
  const extension = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mimeType = allowedTypes.test(file.mimetype);

  if (extension && mimeType) {
    return cb(null, true);
  }

  cb(
    new Error(
      "Only JPG, JPEG, PNG and WEBP image files are allowed."
    )
  );
};

// ==============================
// Storage
// ==============================

const storage = multer.memoryStorage();

// ==============================
// Upload Instance
// ==============================

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10, // Maximum 10 files
  },

  fileFilter,
});

// ==============================
// Export Helpers
// ==============================

module.exports = {
  single: (fieldName) => upload.single(fieldName),

  array: (fieldName, maxCount = 10) =>
    upload.array(fieldName, maxCount),

  fields: (fields) => upload.fields(fields),

  any: () => upload.any(),

  none: () => upload.none(),
};