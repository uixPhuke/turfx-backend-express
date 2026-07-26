// src/config/redis.js

const { createClient } = require("redis");

// ==========================================
// Redis Client
// ==========================================

const redisClient = createClient({
  url: process.env.REDIS_URL,

  socket: {
    reconnectStrategy(retries) {
      if (retries > 10) {
        return new Error("Redis reconnect failed");
      }

      return Math.min(retries * 500, 5000);
    },
  },
});

// ==========================================
// Events
// ==========================================

redisClient.on("connect", () => {
  console.log(" Connecting to Redis...");
});

redisClient.on("ready", () => {
  console.log(" Redis Connected");
});

redisClient.on("reconnecting", () => {
  console.log(" Redis Reconnecting...");
});

redisClient.on("end", () => {
  console.log(" Redis Connection Closed");
});

redisClient.on("error", (error) => {
  console.error(" Redis Error:", error.message);
});

// ==========================================
// Connect Redis
// ==========================================

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    return redisClient;
  } catch (error) {
    console.error(
      " Failed to connect Redis:",
      error.message
    );

    process.exit(1);
  }
};

// ==========================================
// Disconnect Redis
// ==========================================

const disconnectRedis = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }

    console.log(" Redis Disconnected");
  } catch (error) {
    console.error(
      "Redis Disconnect Error:",
      error.message
    );
  }
};

// ==========================================
// Health Check
// ==========================================

const checkRedisHealth = async () => {
  try {
    await redisClient.ping();

    return {
      status: "connected",
      isOpen: redisClient.isOpen,
    };
  } catch (error) {
    return {
      status: "disconnected",
      isOpen: false,
      error: error.message,
    };
  }
};

// ==========================================
// Exports
// ==========================================

module.exports = {
  redisClient,
  connectRedis,
  disconnectRedis,
  checkRedisHealth,
};