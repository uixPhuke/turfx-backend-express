// src/modules/slot/slot.controller.js

const slotService = require("./slot.service");

const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../middlewares/async.middleware");

// ==========================================
// Get Available Slots
// ==========================================

const getAvailableSlots = asyncHandler(async (req, res) => {

  const { turf, date } = req.query;

  const slots = await slotService.getAvailableSlots(
    turf,
    date
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      slots,
      "Available slots fetched successfully"
    )
  );

});

// ==========================================
// Block Slot
// ==========================================

const blockSlot = asyncHandler(async (req, res) => {

  const slot = await slotService.blockSlot(
    req.user._id,
    req.body
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      slot,
      "Slot blocked successfully"
    )
  );

});

// ==========================================
// Unblock Slot
// ==========================================

const unblockSlot = asyncHandler(async (req, res) => {

  const response =
    await slotService.unblockSlot(
      req.user._id,
      req.params.id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      response,
      "Slot unblocked successfully"
    )
  );

});

// ==========================================
// Get Slots By Turf
// ==========================================

const getSlotsByTurf = asyncHandler(async (req, res) => {

  const slots =
    await slotService.getSlotsByTurf(
      req.params.turfId,
      req.query, req.user
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      slots,
      "Slots fetched successfully"
    )
  );

});

// ==========================================
// Get Slots By Date
// ==========================================

const getSlotsByDate = asyncHandler(async (req, res) => {

  const slots =
    await slotService.getSlotsByDate(
      req.params.turfId,
      req.query.date, req.user
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      slots,
      "Date-wise slots fetched successfully"
    )
  );

});
// ==========================================
// Get Owner Slots
// ==========================================

const getOwnerSlots = asyncHandler(async (req, res) => {

  const slots =
    await slotService.getOwnerSlots(
      req.user._id,
      req.query
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      slots,
      "Owner slots fetched successfully"
    )
  );

});

// ==========================================
// Mark Maintenance
// ==========================================

const markMaintenance = asyncHandler(async (req, res) => {

  const slot =
    await slotService.markMaintenance(
      req.user._id,
      req.body
    );

  return res.status(201).json(
    new ApiResponse(
      201,
      slot,
      "Maintenance slot created successfully"
    )
  );

});

// ==========================================
// Remove Maintenance
// ==========================================

const removeMaintenance = asyncHandler(async (req, res) => {

  const response =
    await slotService.removeMaintenance(
      req.user._id,
      req.params.id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      response,
      "Maintenance removed successfully"
    )
  );

});

// ==========================================
// Get Slot Statistics
// ==========================================

const getSlotStatistics = asyncHandler(async (req, res) => {

  const statistics =
    await slotService.getSlotStatistics(
      req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      statistics,
      "Slot statistics fetched successfully"
    )
  );

});

// ==========================================
// Module Exports
// ==========================================

module.exports = {
  getAvailableSlots,

  blockSlot,
  unblockSlot,

  getSlotsByTurf,
  getSlotsByDate,

  getOwnerSlots,

  markMaintenance,
  removeMaintenance,

  getSlotStatistics,
};