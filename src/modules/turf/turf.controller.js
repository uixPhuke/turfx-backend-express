// src/modules/turf/turf.controller.js

const turfService = require("./turf.service");

const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");

const asyncHandler = require("../../middlewares/async.middleware");

// ==========================================
// Create Turf
// ==========================================

const createTurf = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(
      400,
      "At least one turf image is required"
    );
  }

  const turf = await turfService.createTurf(
    req.user._id,
    req.body,
    req.files
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      turf,
      "Turf created successfully"
    )
  );
});

// ==========================================
// Update Turf
// ==========================================

const updateTurf = asyncHandler(async (req, res) => {
  const removeImages = req.body.removeImages
    ? Array.isArray(req.body.removeImages)
      ? req.body.removeImages
      : [req.body.removeImages]
    : [];

  const turf = await turfService.updateTurf(
    req.user._id,
    req.params.id,
    req.body,
    req.files || [],
    removeImages
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      turf,
      "Turf updated successfully"
    )
  );
});

// ==========================================
// Get All Turfs
// ==========================================

const getAllTurfs = asyncHandler(async (req, res) => {
  const result = await turfService.getAllTurfs(
    req.query
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Turfs fetched successfully"
    )
  );
});

// ==========================================
// Get Turf By ID
// ==========================================

const getTurfById = asyncHandler(async (req, res) => {
  const turf = await turfService.getTurfById(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      turf,
      "Turf fetched successfully"
    )
  );
});

// ==========================================
// Get Nearby Turfs
// ==========================================

const getNearbyTurfs = asyncHandler(async (req, res) => {
  const { lat, lng, distance } = req.query;

  const turfs =
    await turfService.getNearbyTurfs(
      lat,
      lng,
      distance
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      turfs,
      "Nearby turfs fetched successfully"
    )
  );
});

// ==========================================
// Get My Turfs
// ==========================================

const getMyTurfs = asyncHandler(async (req, res) => {
  const turfs = await turfService.getMyTurfs(
    req.user._id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      turfs,
      "Your turfs fetched successfully"
    )
  );
});

// ==========================================
// Delete Turf
// ==========================================

const deleteTurf = asyncHandler(async (req, res) => {
  const response =
    await turfService.deleteTurf(
      req.user._id,
      req.params.id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      response,
      "Turf deleted successfully"
    )
  );
});

// ==========================================
// Approve Turf
// ==========================================

const approveTurf = asyncHandler(async (req, res) => {
  const turf =
    await turfService.approveTurf(
      req.params.id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      turf,
      "Turf approved successfully"
    )
  );
});

// ==========================================
// Reject Turf
// ==========================================

const rejectTurf = asyncHandler(async (req, res) => {
  const turf =
    await turfService.rejectTurf(
      req.params.id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      turf,
      "Turf rejected successfully"
    )
  );
});

// ==========================================
// Restore Turf
// ==========================================

const restoreTurf = asyncHandler(async (req, res) => {
  const turf =
    await turfService.restoreTurf(
      req.params.id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      turf,
      "Turf restored successfully"
    )
  );
});

module.exports = {
  createTurf,
  updateTurf,

  getAllTurfs,
  getTurfById,
  getNearbyTurfs,
  getMyTurfs,

  deleteTurf,

  approveTurf,
  rejectTurf,
  restoreTurf,
};