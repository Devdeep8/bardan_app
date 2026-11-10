import { createServer } from "http";
import config from "@configs/app.config.js";
import app from "@src/rest-resources/index.js";
import "@src/events/index.js";
import { Logger } from "@src/utils/logger.js";
import db from "@src/db/models/index.js";
import { redisClient } from "@src/libs/redis.js";

const PORT =
  (typeof config.get === "function" ? config.get("port") : config.port) ||
  process.env.PORT ||
  3000;

const server = createServer(app);

server.listen(PORT, () => {
  Logger.info(`HTTP server listening on http://localhost:${PORT}`);
});

// Graceful Shutdown Implementation
// `done` runs after cleanup: exit for normal signals, or re-raise SIGUSR2 so
// nodemon can complete its restart (see the SIGUSR2 listener below).

// Give the pino transport worker a moment to flush buffered lines before the
// process dies — transport writes are async and silently dropped on abrupt
// exit, which otherwise hides the shutdown logs. Capped so a stuck worker
// can never block shutdown.
const flushLogs = () =>
  Promise.race([
    Logger.flush(),
    new Promise((resolve) => setTimeout(resolve, 500)),
  ]);

const gracefulShutdown = (signal, done = () => process.exit(0)) => {
  Logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    Logger.info("HTTP server closed.");

    try {
      await db.sequelize.close();
      Logger.info("Database connection pool closed.");
    } catch (err) {
      Logger.error("Error closing database connection pool:", err);
    }

    try {
      if (redisClient) {
        await redisClient.quit();
        Logger.info("Redis client connection closed gracefully.");
      }
    } catch (err) {
      Logger.error("Error closing Redis connection:", err);
    }

    Logger.info("Cleanup complete.");
    await flushLogs();
    done();
  });

  // Force shutdown after 10s if connections hang
  setTimeout(async () => {
    Logger.error(
      "Forcefully shutting down because graceful shutdown timed out.",
    );
    await flushLogs();
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// nodemon (dev flow in docker compose) restarts the process on file saves by
// sending SIGUSR2 — without this listener the process dies instantly with no
// cleanup. After cleanup completes, re-raise the signal with the default
// handler (the `once` listener has already removed itself) so nodemon can
// perform the restart.
process.once("SIGUSR2", () =>
  gracefulShutdown("SIGUSR2", () => {
    process.kill(process.pid, "SIGUSR2");
  }),
);

// Listen for process-level errors
process.on("uncaughtException", (err) => {
  Logger.error("CRITICAL: Uncaught Exception outside request lifecycle!", {
    err,
  });
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  Logger.error("WARNING: Unhandled Rejection outside request lifecycle!", {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});
