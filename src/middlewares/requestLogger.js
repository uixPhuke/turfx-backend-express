const pino = require("pino");
const pinoHttp = require("pino-http");

// ==========================================
// Logger
// ==========================================

const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

// ==========================================
// HTTP Request Logger
// ==========================================

const requestLogger = pinoHttp({
  logger,

  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) {
      return "error";
    }

    if (res.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },

  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },

  customErrorMessage(req, res, err) {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },

  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        ip: req.ip,
      };
    },

    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

module.exports = {
  logger,
  requestLogger,
};