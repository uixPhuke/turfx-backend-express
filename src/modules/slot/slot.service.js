const Turf = require("../turf/turf.model");
const Slot = require("./slot.model");

const ApiError = require("../../utils/ApiError");

// ==========================================
// Convert HH:mm -> Minutes
// ==========================================

const timeToMinutes = (time) => {
  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
};

// ==========================================
// Convert Minutes -> HH:mm
// ==========================================

const minutesToTime = (minutes) => {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");

  const minute = (minutes % 60)
    .toString()
    .padStart(2, "0");

  return `${hour}:${minute}`;
};

// ==========================================
// Generate Slots
// ==========================================

const generateSlots = (
  startTime,
  endTime,
  duration
) => {
  const slots = [];

  let start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (start + duration <= end) {
    slots.push({
      startTime: minutesToTime(start),
      endTime: minutesToTime(start + duration),
    });

    start += duration;
  }

  return slots;
};

// ==========================================
// Get Available Slots
// ==========================================

const getAvailableSlots = async (
  turfId,
  bookingDate
) => {
  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new ApiError(404, "Turf not found");
  }

  if (!turf.isApproved) {
    throw new ApiError(
      400,
      "Turf is not approved"
    );
  }

  if (!turf.isActive) {
    throw new ApiError(
      400,
      "Turf is inactive"
    );
  }

 // Working Hours

let openTime = "00:00";
let closeTime = "23:59";

const workingHours = turf.workingHours || {
  is24Hours: true,
  open: "00:00",
  close: "23:59",
};

if (!workingHours.is24Hours) {
  openTime = workingHours.open;
  closeTime = workingHours.close;
} // Working Hours



  // Generate All Possible Slots

  const generatedSlots = generateSlots(
    openTime,
    closeTime,
    turf.slotDuration
  );

  // Fetch Existing Slots

  const existingSlots = await Slot.find({
    turf: turfId,
    bookingDate: new Date(bookingDate),
    status: {
      $in: [
        "booked",
        "blocked",
        "maintenance",
      ],
    },
  });

  // Generate Availability

  const availableSlots = generatedSlots.map(
    (slot) => {
      const existing = existingSlots.find(
        (item) =>
          item.startTime === slot.startTime &&
          item.endTime === slot.endTime
      );

      // Weekday / Weekend Pricing

      const day = new Date(
        bookingDate
      ).getDay();

      const isWeekend =
        day === 0 || day === 6;

      const price = isWeekend
        ? turf.pricing.weekend
        : turf.pricing.weekday;

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,

        price,

        available: !existing,

        status: existing
          ? existing.status
          : "available",
      };
    }
  );

  return availableSlots;
};


// ==========================================
// Block Slot
// ==========================================

const blockSlot = async (
  ownerId,
  data
) => {

  const turf = await Turf.findById(
    data.turf
  );

  if (!turf) {
    throw new ApiError(
      404,
      "Turf not found"
    );
  }

  if (
    turf.owner.toString() !==
    ownerId.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to block slots for this turf"
    );
  }

  // ========================================
  // Prevent Duplicate Slot
  // ========================================

  const existingSlot =
    await Slot.findOne({
      turf: data.turf,
      bookingDate: new Date(
        data.bookingDate
      ),
      startTime: data.startTime,
      endTime: data.endTime,
    });

  if (existingSlot) {
    throw new ApiError(
      409,
      "Slot already exists"
    );
  }

  // ========================================
  // Auto Price Calculation
  // ========================================

  const day = new Date(
    data.bookingDate
  ).getDay();

  const isWeekend =
    day === 0 || day === 6;

  const price = isWeekend
    ? turf.pricing.weekend
    : turf.pricing.weekday;

  // ========================================
  // Create Slot
  // ========================================

  const slot = await Slot.create({

    turf: turf._id,

    owner: ownerId,

    bookingDate: new Date(
      data.bookingDate
    ),

    startTime: data.startTime,

    endTime: data.endTime,

    price,

    status: "blocked",

    reason:
      data.reason || "",

  });

  return slot;

};

// ==========================================
// Unblock Slot
// ==========================================

const unblockSlot = async (
  ownerId,
  slotId
) => {

  const slot =
    await Slot.findById(slotId);

  if (!slot) {
    throw new ApiError(
      404,
      "Slot not found"
    );
  }

  if (
    slot.owner.toString() !==
    ownerId.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to unblock this slot"
    );
  }

  if (slot.status !== "blocked") {
    throw new ApiError(
      400,
      "Only blocked slots can be removed"
    );
  }

  await slot.deleteOne();

  return {
    message:
      "Slot unblocked successfully",
  };

};

// ==========================================
// Check Slot Availability
// ==========================================

const isSlotAvailable = async (
  turfId,
  bookingDate,
  startTime,
  endTime
) => {

  const slot =
    await Slot.findOne({
      turf: turfId,
      bookingDate: new Date(
        bookingDate
      ),
      startTime,
      endTime,
      status: {
        $in: [
          "booked",
          "blocked",
          "maintenance",
        ],
      },
    });

  return !slot;

};
// ==========================================
// Get Slots By Turf
// ==========================================

const getSlotsByTurf = async (
  turfId,
  query = {},
  actor
) => {

  const turf = await Turf.findById(turfId);
  if (!turf || (actor?.role !== "admin" && String(turf.owner) !== String(actor?._id))) {
    throw new ApiError(403, "Unauthorized turf access");
  }
  const {
    page = 1,
    limit = 20,
    status,
    bookingDate,
  } = query;

  const filter = {
    turf: turfId,
  };

  if (status) {
    filter.status = status;
  }

  if (bookingDate) {
    filter.bookingDate = new Date(
      bookingDate
    );
  }

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const slots = await Slot.find(filter)
    .populate(
      "booking",
      "user totalAmount bookingStatus"
    )
    .sort({
      bookingDate: 1,
      startTime: 1,
    })
    .skip(skip)
    .limit(Number(limit));

  const total =
    await Slot.countDocuments(filter);

  return {
    slots,

    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(
        total / Number(limit)
      ),
    },
  };

};

// ==========================================
// Get Slots By Date
// ==========================================

const getSlotsByDate = async (
  turfId,
  bookingDate,
  actor
) => {

  const turf = await Turf.findById(turfId);
  if (!turf || (actor?.role !== "admin" && String(turf.owner) !== String(actor?._id))) {
    throw new ApiError(403, "Unauthorized turf access");
  }

  const slots = await Slot.find({
    turf: turfId,
    bookingDate: new Date(
      bookingDate
    ),
  })
    .populate(
      "booking",
      "user bookingStatus"
    )
    .sort({
      startTime: 1,
    });

  return slots;

};

// ==========================================
// Get Owner Slots
// ==========================================

const getOwnerSlots = async (
  ownerId,
  query = {}
) => {

  const {
    page = 1,
    limit = 20,
    status,
  } = query;

  const filter = {
    owner: ownerId,
  };

  if (status) {
    filter.status = status;
  }

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const slots = await Slot.find(filter)
    .populate(
      "turf",
      "name images"
    )
    .populate(
      "booking",
      "user bookingStatus totalAmount"
    )
    .sort({
      bookingDate: -1,
      startTime: 1,
    })
    .skip(skip)
    .limit(Number(limit));

  const total =
    await Slot.countDocuments(filter);

  return {
    slots,

    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(
        total / Number(limit)
      ),
    },
  };

};
// ==========================================
// Book Slot
// ==========================================

const bookSlot = async (
  bookingId,
  turfId,
  ownerId,
  bookingDate,
  startTime,
  endTime,
  price
) => {

  const existingSlot = await Slot.findOne({
    turf: turfId,
    bookingDate: new Date(bookingDate),
    startTime,
    endTime,
  });

  if (existingSlot) {
    throw new ApiError(
      409,
      "Slot is already booked or unavailable"
    );
  }

  const slot = await Slot.create({
    turf: turfId,
    owner: ownerId,
    booking: bookingId,
    bookingDate: new Date(bookingDate),
    startTime,
    endTime,
    price,
    status: "booked",
  });

  return slot;

};

// ==========================================
// Release Slot
// ==========================================

const releaseSlot = async (slotId) => {
  await Slot.deleteOne({ _id: slotId });
  return true;
};

// ==========================================
// Mark Maintenance
// ==========================================

const markMaintenance = async (
  ownerId,
  data
) => {

  const turf = await Turf.findById(
    data.turf
  );

  if (!turf) {
    throw new ApiError(
      404,
      "Turf not found"
    );
  }

  if (
    turf.owner.toString() !==
    ownerId.toString()
  ) {
    throw new ApiError(
      403,
      "Unauthorized"
    );
  }

  const exists = await Slot.findOne({
    turf: data.turf,
    bookingDate: new Date(
      data.bookingDate
    ),
    startTime: data.startTime,
    endTime: data.endTime,
  });

  if (exists) {
    throw new ApiError(
      409,
      "Slot already exists"
    );
  }

  const day = new Date(
    data.bookingDate
  ).getDay();

  const price =
    day === 0 || day === 6
      ? turf.pricing.weekend
      : turf.pricing.weekday;

  return await Slot.create({

    turf: data.turf,

    owner: ownerId,

    bookingDate: new Date(
      data.bookingDate
    ),

    startTime: data.startTime,

    endTime: data.endTime,

    price,

    status: "maintenance",

    reason:
      data.reason ||
      "Maintenance",

  });

};

// ==========================================
// Remove Maintenance
// ==========================================

const removeMaintenance = async (
  ownerId,
  slotId
) => {

  const slot =
    await Slot.findById(
      slotId
    );

  if (!slot) {
    throw new ApiError(
      404,
      "Slot not found"
    );
  }

  if (
    slot.owner.toString() !==
    ownerId.toString()
  ) {
    throw new ApiError(
      403,
      "Unauthorized"
    );
  }

  if (
    slot.status !==
    "maintenance"
  ) {
    throw new ApiError(
      400,
      "This slot is not under maintenance"
    );
  }

  await slot.deleteOne();

  return {
    message:
      "Maintenance removed successfully",
  };

};

// ==========================================
// Slot Statistics
// ==========================================

const getSlotStatistics = async (
  ownerId
) => {

  const total =
    await Slot.countDocuments({
      owner: ownerId,
    });

  const booked =
    await Slot.countDocuments({
      owner: ownerId,
      status: "booked",
    });

  const blocked =
    await Slot.countDocuments({
      owner: ownerId,
      status: "blocked",
    });

  const maintenance =
    await Slot.countDocuments({
      owner: ownerId,
      status: "maintenance",
    });

  const available =
    total -
    booked -
    blocked -
    maintenance;

  return {

    total,

    available,

    booked,

    blocked,

    maintenance,

  };

};

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  getAvailableSlots,

  blockSlot,
  unblockSlot,

  isSlotAvailable,

  getSlotsByTurf,
  getSlotsByDate,
  getOwnerSlots,

  bookSlot,
  releaseSlot,

  markMaintenance,
  removeMaintenance,

  getSlotStatistics,

};