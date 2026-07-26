// src/services/lock.service.js

const crypto = require("crypto");
const { redisClient } = require("../config/redis");

class LockService {
  constructor() {
    this.defaultTTL = 30; // seconds
  }

  // ==========================================
  // Acquire Lock
  // ==========================================

  async acquireLock(
    key,
    ttl = this.defaultTTL
  ) {
    const token = crypto.randomUUID();

    const result = await redisClient.set(
      `lock:${key}`,
      token,
      {
        NX: true,
        EX: ttl,
      }
    );

    if (result !== "OK") {
      return null;
    }

    return token;
  }

  // ==========================================
  // Release Lock
  // ==========================================

  async releaseLock(
    key,
    token
  ) {
    const lockKey = `lock:${key}`;

    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("DEL", KEYS[1])
      else
          return 0
      end
    `;

    return redisClient.eval(script, {
      keys: [lockKey],
      arguments: [token],
    });
  }

  // ==========================================
  // Extend Lock
  // ==========================================

  async extendLock(
    key,
    token,
    ttl = this.defaultTTL
  ) {
    const lockKey = `lock:${key}`;

    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("EXPIRE", KEYS[1], ARGV[2])
      else
          return 0
      end
    `;

    return redisClient.eval(script, {
      keys: [lockKey],
      arguments: [
        token,
        ttl.toString(),
      ],
    });
  }

  // ==========================================
  // Check Lock
  // ==========================================

  async isLocked(key) {
    return Boolean(
      await redisClient.exists(
        `lock:${key}`
      )
    );
  }

  // ==========================================
  // Get Remaining TTL
  // ==========================================

  async getTTL(key) {
    return redisClient.ttl(
      `lock:${key}`
    );
  }

  // ==========================================
  // Execute With Lock
  // ==========================================

  async executeWithLock(
    key,
    callback,
    ttl = this.defaultTTL
  ) {
    const token =
      await this.acquireLock(
        key,
        ttl
      );

    if (!token) {
      throw new Error(
        "Resource is currently locked."
      );
    }

    try {
      return await callback();
    } finally {
      await this.releaseLock(
        key,
        token
      );
    }
  }
}

module.exports = new LockService();