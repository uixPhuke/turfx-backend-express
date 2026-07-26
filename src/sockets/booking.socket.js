// src/socket/booking.socket.js

const Booking = require("../modules/booking/booking.model");
const Slot = require("../modules/slot/slot.model");

// ==========================================
// Booking Socket
// ==========================================

const registerBookingSocket = (
  io,
  socket
) => {

  // ========================================
  // Join Turf Room
  // ========================================

  socket.on(
    "booking:join-turf",
    async (turfId) => {

      socket.join(
        `turf:${turfId}`
      );

      socket.emit(
        "booking:joined",
        {
          turfId,
        }
      );

    }
  );

  // ========================================
  // Leave Turf Room
  // ========================================

  socket.on(
    "booking:leave-turf",
    (turfId) => {

      socket.leave(
        `turf:${turfId}`
      );

    }
  );

  // ========================================
  // Get Live Slots
  // ========================================

  socket.on(
    "booking:get-slots",
    async ({
      turfId,
      date,
    }) => {

      try {

        const slots =
          await Slot.find({

            turf: turfId,

            date,

          });

        socket.emit(
          "booking:slots",
          slots
        );

      } catch (error) {

        socket.emit(
          "booking:error",
          error.message
        );

      }

    }
  );

  // ========================================
  // Booking Created
  // ========================================

  socket.on(
    "booking:created",
    async ({
      bookingId,
    }) => {

      try {

        const booking =
          await Booking.findById(
            bookingId
          )
            .populate("slot")
            .populate("user");

        if (!booking) {
          return;
        }

        io.to(
          `turf:${booking.slot.turf}`
        ).emit(
          "booking:new",
          booking
        );

      } catch (error) {

        socket.emit(
          "booking:error",
          error.message
        );

      }

    }
  );

  // ========================================
  // Booking Cancelled
  // ========================================

  socket.on(
    "booking:cancelled",
    async ({
      bookingId,
    }) => {

      try {

        const booking =
          await Booking.findById(
            bookingId
          ).populate("slot");

        if (!booking) {
          return;
        }

        io.to(
          `turf:${booking.slot.turf}`
        ).emit(
          "booking:cancelled",
          {

            bookingId,

            slot: booking.slot,

          }

        );

      } catch (error) {

        socket.emit(
          "booking:error",
          error.message
        );

      }

    }
  );

  // ========================================
  // Slot Updated
  // ========================================

  socket.on(
    "booking:update-slot",
    ({
      turfId,
      slotId,
      status,
    }) => {

      io.to(
        `turf:${turfId}`
      ).emit(
        "booking:slot-updated",
        {

          slotId,

          status,

        }
      );

    }
  );

  // ========================================
  // Booking Confirmed
  // ========================================

  socket.on(
    "booking:confirmed",
    ({
      bookingId,
      turfId,
    }) => {

      io.to(
        `turf:${turfId}`
      ).emit(
        "booking:confirmed",
        {

          bookingId,

        }
      );

    }
  );

};

module.exports =
  registerBookingSocket;