// src/utils/logger.js
import appConfig from "@configs/app.config.js";
import pino from "pino";
import { v4 as uuid } from "uuid";

// Wrap config object to support .get() method if not a convict instance
const config = typeof appConfig.get === "function" ? appConfig : {
  get: (key) => {
    return key.split(".").reduce((acc, part) => acc && acc[part], appConfig);
  },
};

// Logging constants
const LOG_CONSTANTS = {
  LEVELS: {
    FATAL: 60,
    ERROR: 50,
    WARN: 40,
    INFO: 30,
    DEBUG: 20,
  },
  CATEGORIES: {
    SYSTEM: "system",
    BUSINESS: "business",
    SECURITY: "security",
  },
  SENSITIVE_FIELDS: [
    "password",
    "token",
    "secret",
    "key",
    "authorization",
    "cookie",
  ],
};

// Environment detection
const isProduction = config.get("env") === "production";

// Sanitize sensitive data and handle circular references
function sanitize(obj, visited = new WeakSet()) {
  if (!obj || typeof obj !== "object") return obj;
  if (visited.has(obj)) return "[Circular]";

  visited.add(obj);
  const result = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Do not recurse into Express request/response objects
    if (["req", "res"].includes(lowerKey)) {
      result[key] = value;
      continue;
    }

    if (
      LOG_CONSTANTS.SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))
    ) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      result[key] = sanitize(value, visited);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Logger configuration
const logger = pino({
  level: config.get("log_level") || (isProduction ? "info" : "debug"),
  base: {
    app: config.get("app.name") || "app",
    version: config.get("app.version") || "1.0.0",
    instanceId: process.env.INSTANCE_ID || uuid().split("-")[0],
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: (req) =>
      req
        ? {
            method: req.method,
            url: req.url,
            headers: sanitize(req.headers),
            userAgent: req.headers?.["user-agent"],
          }
        : undefined,
    res: (res) =>
      res
        ? {
            statusCode: res.statusCode,
            headers: sanitize(res.getHeaders()),
          }
        : undefined,
    err: pino.stdSerializers.err,
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }),
});

class Logger {
  constructor(baseLogger) {
    this.logger = baseLogger;
  }

  child(bindings = {}) {
    return new Logger(this.logger.child(bindings));
  }

  info(msg, meta = {}) {
    try {
      this.logger.info({ ...sanitize(meta) }, msg);
    } catch (err) {
      console.error('Logger warning: Failed to sanitize metadata in info log.', err);
      this.logger.info({}, `${msg} (metadata failed to log)`);
    }
  }

  error(msg, meta = {}) {
    try {
      this.logger.error({ ...sanitize(meta) }, msg);
    } catch (err) {
      console.error('Logger warning: Failed to sanitize metadata in error log.', err);
      this.logger.error({}, `${msg} (metadata failed to log)`);
    }
  }

  warn(msg, meta = {}) {
    try {
      this.logger.warn({ ...sanitize(meta) }, msg);
    } catch (err) {
      console.error('Logger warning: Failed to sanitize metadata in warn log.', err);
      this.logger.warn({}, `${msg} (metadata failed to log)`);
    }
  }

  debug(msg, meta = {}) {
    try {
      this.logger.debug({ ...sanitize(meta) }, msg);
    } catch (err) {
      console.error('Logger warning: Failed to sanitize metadata in debug log.', err);
      this.logger.debug({}, `${msg} (metadata failed to log)`);
    }
  }

  fatal(msg, meta = {}) {
    try {
      this.logger.fatal({ ...sanitize(meta) }, msg);
    } catch (err) {
      console.error('Logger warning: Failed to sanitize metadata in fatal log.', err);
      this.logger.fatal({}, `${msg} (metadata failed to log)`);
    }
  }

  request(req, msg = "Incoming request") {
    try {
      const traceId = req.traceId || uuid().split("-")[0];
      this.info(msg, {
        req,
        category: LOG_CONSTANTS.CATEGORIES.SYSTEM,
        requestId: traceId,
      });
    } catch (err) {
      console.error('Logger warning: Failed to process request log.', err);
    }
  }

  response(req, res, duration, msg = "Request completed") {
    try {
      const traceId = req.traceId || uuid().split("-")[0];
      this.info(msg, {
        req,
        res,
        duration,
        category: LOG_CONSTANTS.CATEGORIES.SYSTEM,
        requestId: traceId,
      });
    } catch (err) {
      console.error('Logger warning: Failed to process response log.', err);
    }
  }
}

// Create logger instance
const appLogger = new Logger(logger);
export { LOG_CONSTANTS, appLogger as Logger };
