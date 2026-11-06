const Turf = require("../modules/turf/turf.model");
const slotService = require("../modules/slot/slot.service");
const mongoose = require("mongoose");

module.exports = (io, socket) => {
  const approvedTurf = async (id) => {
    if (!mongoose.isValidObjectId(id)) throw new Error("Invalid turf ID");
    const turf = await Turf.findOne({ _id: id, isApproved: true, isActive: true });
    if (!turf) throw new Error("Turf unavailable");
    return turf;
  };
  socket.on("booking:join-turf", async (turfId) => {
    try {
      await approvedTurf(turfId);
      await socket.join(`turf:${turfId}`);
      socket.emit("booking:joined", { turfId });
    } catch (error) { socket.emit("booking:error", { message: error.message }); }
  });
  socket.on("booking:leave-turf", (turfId) => socket.leave(`turf:${turfId}`));
  socket.on("booking:get-slots", async ({ turfId, date } = {}) => {
    try {
      await approvedTurf(turfId);
      if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) {
        throw new Error("Invalid date");
      }
      socket.emit("booking:slots", await slotService.getAvailableSlots(turfId, date));
    } catch (error) { socket.emit("booking:error", { message: error.message }); }
  });
  // Booking/payment mutations and broadcasts originate from authorized server services only.
};
