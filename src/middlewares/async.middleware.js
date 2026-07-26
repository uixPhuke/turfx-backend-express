/**
 * Handles async errors automatically.
 *
 * Usage:
 * const asyncHandler = require("../../middlewares/async.middleware");
 *
 * const getProfile = asyncHandler(async (req, res) => {
 *     ...
 * });
 */

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;