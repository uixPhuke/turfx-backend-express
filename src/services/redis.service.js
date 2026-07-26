// src/services/redis.service.js

const { redisClient } = require("../config/redis");

class RedisService {
  // ==========================================
  // String Operations
  // ==========================================

  async set(key, value, ttl = null) {
    try {
      if (ttl) {
        await redisClient.set(key, value, {
          EX: ttl,
        });
      } else {
        await redisClient.set(key, value);
      }

      return true;
    } catch (error) {
      console.error("Redis SET Error:", error.message);
      return false;
    }
  }

  async get(key) {
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error("Redis GET Error:", error.message);
      return null;
    }
  }

  async del(key) {
    try {
      return await redisClient.del(key);
    } catch (error) {
      console.error("Redis DEL Error:", error.message);
      return 0;
    }
  }

  async exists(key) {
    try {
      return Boolean(await redisClient.exists(key));
    } catch (error) {
      console.error("Redis EXISTS Error:", error.message);
      return false;
    }
  }

  async expire(key, seconds) {
    try {
      return await redisClient.expire(key, seconds);
    } catch (error) {
      console.error("Redis EXPIRE Error:", error.message);
      return false;
    }
  }

  async ttl(key) {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      console.error("Redis TTL Error:", error.message);
      return -1;
    }
  }

  // ==========================================
  // JSON Operations
  // ==========================================

  async setJSON(key, value, ttl = null) {
    return this.set(
      key,
      JSON.stringify(value),
      ttl
    );
  }

  async getJSON(key) {
    try {
      const data = await this.get(key);

      return data
        ? JSON.parse(data)
        : null;
    } catch (error) {
      console.error(
        "Redis JSON Parse Error:",
        error.message
      );
      return null;
    }
  }

  // ==========================================
  // Increment / Decrement
  // ==========================================

  async increment(key) {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      console.error(
        "Redis INCR Error:",
        error.message
      );
      return null;
    }
  }

  async decrement(key) {
    try {
      return await redisClient.decr(key);
    } catch (error) {
      console.error(
        "Redis DECR Error:",
        error.message
      );
      return null;
    }
  }

  // ==========================================
  // Hash Operations
  // ==========================================

  async hSet(key, field, value) {
    try {
      return await redisClient.hSet(
        key,
        field,
        value
      );
    } catch (error) {
      console.error(
        "Redis HSET Error:",
        error.message
      );
      return null;
    }
  }

  async hGet(key, field) {
    try {
      return await redisClient.hGet(
        key,
        field
      );
    } catch (error) {
      console.error(
        "Redis HGET Error:",
        error.message
      );
      return null;
    }
  }

  async hGetAll(key) {
    try {
      return await redisClient.hGetAll(key);
    } catch (error) {
      console.error(
        "Redis HGETALL Error:",
        error.message
      );
      return {};
    }
  }

  async hDel(key, field) {
    try {
      return await redisClient.hDel(
        key,
        field
      );
    } catch (error) {
      console.error(
        "Redis HDEL Error:",
        error.message
      );
      return 0;
    }
  }

  // ==========================================
  // List Operations
  // ==========================================

  async lPush(key, value) {
    try {
      return await redisClient.lPush(
        key,
        value
      );
    } catch (error) {
      console.error(
        "Redis LPUSH Error:",
        error.message
      );
      return null;
    }
  }

  async rPush(key, value) {
    try {
      return await redisClient.rPush(
        key,
        value
      );
    } catch (error) {
      console.error(
        "Redis RPUSH Error:",
        error.message
      );
      return null;
    }
  }

  async lRange(key, start = 0, stop = -1) {
    try {
      return await redisClient.lRange(
        key,
        start,
        stop
      );
    } catch (error) {
      console.error(
        "Redis LRANGE Error:",
        error.message
      );
      return [];
    }
  }

  // ==========================================
  // Set Operations
  // ==========================================

  async sAdd(key, value) {
    try {
      return await redisClient.sAdd(
        key,
        value
      );
    } catch (error) {
      console.error(
        "Redis SADD Error:",
        error.message
      );
      return null;
    }
  }

  async sMembers(key) {
    try {
      return await redisClient.sMembers(
        key
      );
    } catch (error) {
      console.error(
        "Redis SMEMBERS Error:",
        error.message
      );
      return [];
    }
  }

  async sRem(key, value) {
    try {
      return await redisClient.sRem(
        key,
        value
      );
    } catch (error) {
      console.error(
        "Redis SREM Error:",
        error.message
      );
      return null;
    }
  }

  // ==========================================
  // Pub / Sub
  // ==========================================

  async publish(channel, message) {
    try {
      return await redisClient.publish(
        channel,
        typeof message === "string"
          ? message
          : JSON.stringify(message)
      );
    } catch (error) {
      console.error(
        "Redis Publish Error:",
        error.message
      );
      return null;
    }
  }

  // ==========================================
  // Flush (Development Only)
  // ==========================================

  async flushAll() {
    if (
      process.env.NODE_ENV ===
      "production"
    ) {
      throw new Error(
        "flushAll is disabled in production."
      );
    }

    return redisClient.flushAll();
  }
}

module.exports = new RedisService();