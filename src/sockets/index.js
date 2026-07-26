// src/socket/index.js

const { Server } = require("socket.io");

const socketAuth = require("./middleware");

const registerBookingSocket = require("./booking.socket");
const registerNotificationSocket = require("./notification.socket");
const registerOwnerSocket = require("./owner.socket");
const registerAdminSocket = require("./admin.socket");

let io;

// ==========================================
// Initialize Socket.IO
// ==========================================

const initializeSocket = (server) => {

  io = new Server(server, {

    cors: {

      origin: process.env.CLIENT_URL,

      credentials: true,

      methods: [

        "GET",

        "POST",

      ],

    },

    transports: [

      "websocket",

      "polling",

    ],

  });

  // ==========================================
  // Authentication
  // ==========================================

  io.use(socketAuth);

  // ==========================================
  // Connection
  // ==========================================

  io.on("connection", (socket) => {

    console.log(
      `🟢 ${socket.user.role} connected : ${socket.id}`
    );

    // Join personal room
    socket.join(
      `user:${socket.user._id}`
    );

    // Register Modules

    registerBookingSocket(io, socket);

    registerNotificationSocket(io, socket);

    registerOwnerSocket(io, socket);

    registerAdminSocket(io, socket);

    // Disconnect

    socket.on(
      "disconnect",
      (reason) => {

        console.log(

          `🔴 ${socket.id} disconnected`,

          reason

        );

      }
    );

  });

  return io;

};

// ==========================================
// Get IO Instance
// ==========================================

const getIO = () => {

  if (!io) {

    throw new Error(
      "Socket.IO has not been initialized."
    );

  }

  return io;

};

// ==========================================
// Emit Helpers
// ==========================================

const emitToUser = (
  userId,
  event,
  data
) => {

  getIO()

    .to(`user:${userId}`)

    .emit(
      event,
      data
    );

};

const emitToRoom = (
  room,
  event,
  data
) => {

  getIO()

    .to(room)

    .emit(
      event,
      data
    );

};

const broadcast = (
  event,
  data
) => {

  getIO()

    .emit(
      event,
      data
    );

};

// ==========================================
// Exports
// ==========================================

module.exports = {

  initializeSocket,

  getIO,

  emitToUser,

  emitToRoom,

  broadcast,

};