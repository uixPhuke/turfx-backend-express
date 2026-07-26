// src/config/bullmq.js

const { Queue, Worker, QueueEvents } = require("bullmq");
const IORedis = require("ioredis");

// ==========================================
// Redis Connection
// ==========================================

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,

  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  },
});

// ==========================================
// Connection Events
// ==========================================

connection.on("connect", () => {
  console.log("🟡 BullMQ Redis Connecting...");
});

connection.on("ready", () => {
  console.log("🟢 BullMQ Redis Connected");
});

connection.on("error", (error) => {
  console.error(
    "🔴 BullMQ Redis Error:",
    error.message
  );
});

connection.on("close", () => {
  console.log(
    "🟠 BullMQ Redis Connection Closed"
  );
});

// ==========================================
// Queue Factory
// ==========================================

const createQueue = (
  queueName,
  options = {}
) => {

  return new Queue(queueName, {

    connection,

    defaultJobOptions: {

      removeOnComplete: 100,

      removeOnFail: 1000,

      attempts: 3,

      backoff: {

        type: "exponential",

        delay: 2000,

      },

      ...options,

    },

  });

};

// ==========================================
// Worker Factory
// ==========================================

const createWorker = (
  queueName,
  processor,
  options = {}
) => {

  return new Worker(

    queueName,

    processor,

    {

      connection,

      concurrency: 5,

      ...options,

    }

  );

};

// ==========================================
// Queue Events Factory
// ==========================================

const createQueueEvents = (
  queueName
) => {

  return new QueueEvents(

    queueName,

    {

      connection,

    }

  );

};

// ==========================================
// Queue Health
// ==========================================

const checkQueueHealth =
  async () => {

    try {

      await connection.ping();

      return {

        status: "healthy",

        redis: "connected",

      };

    } catch (error) {

      return {

        status: "unhealthy",

        redis: "disconnected",

        error: error.message,

      };

    }

  };

// ==========================================
// Graceful Shutdown
// ==========================================

const disconnectBullMQ =
  async () => {

    await connection.quit();

  };

// ==========================================
// Exports
// ==========================================

module.exports = {

  connection,

  createQueue,

  createWorker,

  createQueueEvents,

  checkQueueHealth,

  disconnectBullMQ,

};