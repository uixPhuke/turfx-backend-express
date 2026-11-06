const express = require("express");

const router = express.Router();

const turfController = require("./turf.controller");

const {
  createTurfValidation,
  updateTurfValidation,
  turfIdValidation,
  searchValidation,
  nearbyValidation,
  approveTurfValidation,
  rejectTurfValidation,
  deleteTurfValidation,
} = require("./turf.validation");

const auth = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validation.middleware");
const upload = require("../../middlewares/upload.middleware");

// ==========================================
// Public Routes
// ==========================================

// Get All Turfs
router.get(
  "/",
  searchValidation,
  validate,
  turfController.getAllTurfs
);

// Nearby Turfs
router.get(
  "/nearby",
  nearbyValidation,
  validate,
  turfController.getNearbyTurfs
);

// Get My Turfs
router.get(
  "/mine",
  auth,
  authorize("owner"),
  turfController.getMyTurfs
);


// Get Turf Details
router.get(
  "/:id",
  turfIdValidation,
  validate,
  turfController.getTurfById
);

// ==========================================
// Owner Routes
// ==========================================

// Create Turf
router.post(
  "/",
  auth,
  authorize("owner"),
  upload.array("images", 10),

  // Convert multipart sports field into an array
  (req, res, next) => {
    if (req.body.sports && !Array.isArray(req.body.sports)) {
      req.body.sports = [req.body.sports];
    }
    next();
  },

  createTurfValidation,
  validate,
  turfController.createTurf
);
// Update Turf
router.patch(
  "/:id",
  auth,
  authorize("owner"),
  upload.array("images", 10),
  updateTurfValidation,
  validate,
  turfController.updateTurf
);

// Delete Turf
router.delete(
  "/:id",
  auth,
  authorize("owner"),
  deleteTurfValidation,
  validate,
  turfController.deleteTurf
);

// ==========================================
// Admin Routes
// ==========================================

// Approve Turf
router.patch(
  "/:id/approve",
  auth,
  authorize("admin"),
  approveTurfValidation,
  validate,
  turfController.approveTurf
);

// Reject Turf
router.patch(
  "/:id/reject",
  auth,
  authorize("admin"),
  rejectTurfValidation,
  validate,
  turfController.rejectTurf
);

// Restore Turf
router.patch(
  "/:id/restore",
  auth,
  authorize("admin"),
  turfIdValidation,
  validate,
  turfController.restoreTurf
);

module.exports = router;