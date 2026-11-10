import { createServer } from 'http';
import config from '@configs/app.config.js';
import app from '@src/rest-resources/index.js';
import '@src/events/index.js';
import { Logger } from '@src/utils/logger.js';
import db from '@src/db/models/index.js';
import { redisClient } from '@src/libs/redis.js';

const PORT = (typeof config.get === 'function' ? config.get('port') : config.port) || process.env.PORT || 3006;

const server = createServer(app);

server.listen(PORT, () => {
  Logger.info(`HTTP server listening on http://localhost:${PORT}`);
});

// Graceful Shutdown Implementation
const gracefulShutdown = (signal) => {
  Logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    Logger.info('HTTP server closed.');
    
    try {
      await db.sequelize.close();
      Logger.info('Database connection pool closed.');
    } catch (err) {
      Logger.error('Error closing database connection pool:', err);
    }

    try {
      if (redisClient) {
        await redisClient.quit();
        Logger.info('Redis client connection closed gracefully.');
      }
    } catch (err) {
      Logger.error('Error closing Redis connection:', err);
    }
    
    Logger.info('Process exiting cleanly.');
    process.exit(0);
  });

  // Force shutdown after 10s if connections hang
  setTimeout(() => {
    Logger.error('Forcefully shutting down because graceful shutdown timed out.');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Listen for process-level errors
process.on('uncaughtException', (err) => {
  Logger.error('CRITICAL: Uncaught Exception outside request lifecycle!', { err });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('WARNING: Unhandled Rejection outside request lifecycle!', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
});
