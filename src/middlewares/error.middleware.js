const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  console.error("========== ERROR ==========");
  console.error(err);
  console.error(err.stack);
  console.error("===========================");

  // existing code...
  // Default Error
  let error = err;

  // Unknown Error
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;

    error = new ApiError(
      statusCode,
      error.message || "Internal Server Error",
      error.errors || [],
      error.stack
    );
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);

    error = new ApiError(
      400,
      "Validation Error",
      errors
    );
  }

  // Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];

    error = new ApiError(
      409,
      `${field} already exists`
    );
  }

  // Invalid ObjectId
  if (err.name === "CastError") {
    error = new ApiError(
      400,
      `Invalid ${err.path}`
    );
  }

  // JWT Invalid
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(
      401,
      "Invalid Token"
    );
  }

  // JWT Expired
  if (err.name === "TokenExpiredError") {
    error = new ApiError(
      401,
      "Token Expired"
    );
  }

  return res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal Server Error" : error.message,
    errors: error.errors,
    stack:
      process.env.NODE_ENV === "development"
        ? error.stack
        : undefined,
  });
};

module.exports = errorHandler;