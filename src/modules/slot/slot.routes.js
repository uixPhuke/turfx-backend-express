// src/modules/slot/slot.routes.js

const express = require("express");

const router = express.Router();

const slotController = require("./slot.controller");

const {
  getAvailableSlotsValidation,
  blockSlotValidation,
  unblockSlotValidation,
  turfSlotsValidation,
  slotsByDateValidation,
} = require("./slot.validation");

const auth = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validation.middleware");

// ==========================================
// Public Routes
// ==========================================

// Get Available Slots
// GET /api/v1/slots/available?turf=<id>&date=YYYY-MM-DD

router.get(
  "/available",
  getAvailableSlotsValidation,
  validate,
  slotController.getAvailableSlots
);

// ==========================================
// Owner Routes
// ==========================================

// Get Owner Slots
// GET /api/v1/slots/mine

router.get(
  "/mine",
  auth,
  authorize("owner"),
  slotController.getOwnerSlots
);

// Get Slots By Turf
// GET /api/v1/slots/turf/:turfId

router.get(
  "/turf/:turfId",
  auth,
  authorize("owner", "admin"),
  turfSlotsValidation,
  validate,
  slotController.getSlotsByTurf
);

// Get Slots By Date
// GET /api/v1/slots/turf/:turfId/date?date=YYYY-MM-DD

router.get(
  "/turf/:turfId/date",
  auth,
  authorize("owner", "admin"),
  slotsByDateValidation,
  validate,
  slotController.getSlotsByDate
);

// Block Slot

router.post(
  "/block",
  auth,
  authorize("owner"),
  blockSlotValidation,
  validate,
  slotController.blockSlot
);

// Unblock Slot

router.delete(
  "/:id/unblock",
  auth,
  authorize("owner"),
  unblockSlotValidation,
  validate,
  slotController.unblockSlot
);

// Mark Maintenance

router.post(
  "/maintenance",
  auth,
  authorize("owner"),
  blockSlotValidation,
  validate,
  slotController.markMaintenance
);

// Remove Maintenance

router.delete(
  "/maintenance/:id",
  auth,
  authorize("owner"),
  unblockSlotValidation,
  validate,
  slotController.removeMaintenance
);

// Slot Statistics

router.get(
  "/statistics",
  auth,
  authorize("owner"),
  slotController.getSlotStatistics
);

module.exports = router;