require("dotenv").config();

const connectDB = require("../config/db");
const { connectRedis } = require("../config/redis");

async function startWorkers() {
  try {
    await connectDB();
    await connectRedis();

    // Import all workers
    require("./email.worker");
    require("./notification.worker");
    require("./booking.worker");
    require("./payment.worker");
    require("./cleanup.worker");
    require("./reminder.worker");

    console.log(" All BullMQ Workers Started");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

startWorkers();