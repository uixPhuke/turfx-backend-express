// src/socket/owner.socket.js

const Booking = require("../modules/booking/booking.model");
const Turf = require("../modules/turf/turf.model");

// ==========================================
// Owner Socket
// ==========================================

const registerOwnerSocket = (
  io,
  socket
) => {

  // Only owners
  if (socket.user.role !== "owner") {
    return;
  }

  const ownerId =
    socket.user._id.toString();

  // ========================================
  // Join Owner Dashboard
  // ========================================

  socket.on(
    "owner:join-dashboard",
    () => {

      socket.join(
        `owner:${ownerId}`
      );

      socket.emit(
        "owner:joined",
        {

          room: `owner:${ownerId}`,

        }
      );

    }
  );

  // ========================================
  // Leave Dashboard
  // ========================================

  socket.on(
    "owner:leave-dashboard",
    () => {

      socket.leave(
        `owner:${ownerId}`
      );

    }
  );

  // ========================================
  // Dashboard Statistics
  // ========================================

  socket.on(
    "owner:dashboard",
    async () => {

      try {

        const totalTurfs =
          await Turf.countDocuments({

            owner: ownerId,

            isDeleted: false,

          });

        const totalBookings =
          await Booking.countDocuments({

            owner: ownerId,

          });

        socket.emit(
          "owner:dashboard",
          {

            totalTurfs,

            totalBookings,

          }
        );

      } catch (error) {

        socket.emit(
          "owner:error",
          {

            message:
              error.message,

          }
        );

      }

    }
  );

  // ========================================
  // Recent Bookings
  // ========================================

  socket.on(
    "owner:bookings",
    async () => {

      try {

        const bookings =
          await Booking.find({

            owner: ownerId,

          })

            .sort({

              createdAt: -1,

            })

            .limit(10)

            .populate(
              "user",
              "name email"
            )

            .populate(
              "turf",
              "name"
            );

        socket.emit(
          "owner:bookings",
          bookings
        );

      } catch (error) {

        socket.emit(
          "owner:error",
          {

            message:
              error.message,

          }
        );

      }

    }
  );

  // ========================================
  // Turf Status
  // ========================================

  socket.on(
    "owner:turfs",
    async () => {

      try {

        const turfs =
          await Turf.find({

            owner: ownerId,

            isDeleted: false,

          });

        socket.emit(
          "owner:turfs",
          turfs
        );

      } catch (error) {

        socket.emit(
          "owner:error",
          {

            message:
              error.message,

          }
        );

      }

    }
  );

  // ========================================
  // Ping
  // ========================================

  socket.on(
    "owner:ping",
    () => {

      socket.emit(
        "owner:pong",
        {

          time: new Date(),

        }
      );

    }
  );

};

module.exports =
  registerOwnerSocket;