require("dotenv").config();

const http = require("http");

const app = require("./app");

const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const {
  verifyMailConnection,
} = require("./utils/sendEmail");
const {
  verifyCloudinaryConnection,
} = require("./config/cloudinary");

const { initializeSocket } = require("./sockets");

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {

    // Database
    await connectDB();

    // Redis
    await connectRedis();

    // Mail
    await verifyMailConnection();

    // Cloudinary
    await verifyCloudinaryConnection();

    // Create HTTP Server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initializeSocket(server);

    // Start Server
    server.listen(PORT, () => {

      console.log(`
==========================================
 TurfX Backend Started Successfully
==========================================
 Server      : http://localhost:${PORT}
 Environment : ${process.env.NODE_ENV}
==========================================
`);

    });

  } catch (error) {

    console.error(" Server Startup Failed");

    console.error(error);

    process.exit(1);

  }
};

startServer();