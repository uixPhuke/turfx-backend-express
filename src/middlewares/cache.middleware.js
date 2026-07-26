// src/middlewares/cache.middleware.js

const cacheService = require("../services/cache.service");

// ==========================================
// Cache Middleware
// ==========================================

const cache = (options = {}) => {

  const {

    ttl = 300,

    key = null,

    enabled = true,

  } = options;

  return async (req, res, next) => {

    if (!enabled) {
      return next();
    }

    // Skip cache if requested
    if (
      req.query.noCache === "true" ||
      req.headers["x-skip-cache"] === "true"
    ) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    try {

      const cacheKey =

        typeof key === "function"

          ? key(req)

          : key ||

            `${req.originalUrl}:${JSON.stringify(
              req.query
            )}`;

      const cached =
        await cacheService.get(cacheKey);

      if (cached) {

        return res.status(200).json({

          success: true,

          cached: true,

          data: cached,

        });

      }

      const originalJson =
        res.json.bind(res);

      res.json = async (body) => {

        try {

          if (
            res.statusCode >= 200 &&
            res.statusCode < 300
          ) {

            await cacheService.set(
              cacheKey,
              body,
              ttl
            );

          }

        } catch (error) {

          console.error(
            "Cache Store Error:",
            error.message
          );

        }

        return originalJson(body);

      };

      next();

    } catch (error) {

      console.error(
        "Cache Middleware Error:",
        error.message
      );

      next();

    }

  };

};

// ==========================================
// Cache Invalidation
// ==========================================

const invalidateCache =
  (...keys) =>
  async (req, res, next) => {

    try {

      for (const key of keys) {

        const cacheKey =

          typeof key === "function"

            ? key(req)

            : key;

        await cacheService.remove(
          cacheKey
        );

      }

    } catch (error) {

      console.error(
        "Cache Invalidation Error:",
        error.message
      );

    }

    next();

  };

// ==========================================
// Clear Cache By Prefix
// ==========================================

const invalidatePattern =
  (pattern) =>
  async (req, res, next) => {

    try {

      const redis =
        require("../config/redis")
          .redisClient;

      const keys =
        await redis.keys(
          `${pattern}*`
        );

      if (keys.length) {

        await redis.del(keys);

      }

    } catch (error) {

      console.error(
        "Pattern Cache Error:",
        error.message
      );

    }

    next();

  };

// ==========================================
// Exports
// ==========================================

module.exports = {

  cache,

  invalidateCache,

  invalidatePattern,

};