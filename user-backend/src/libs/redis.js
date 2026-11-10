import Redis from 'ioredis';
import config from '@configs/app.config.js';
import { Logger } from '@src/utils/logger.js';

let redisClient = null;
let isRedisConnected = false;

const host = config.get('redis.host') || '127.0.0.1';
const port = parseInt(config.get('redis.port') || '6379', 10);
const password = config.get('redis.password') || undefined;

try {
  const redisOptions = {
    host,
    port,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    reconnectOnError: (err) => {
      Logger.warn('Redis reconnectOnError triggered:', { error: err.message });
      return true;
    }
  };

  if (password) {
    redisOptions.password = password;
  }

  Logger.info(`Initializing Redis client connecting to ${host}:${port}...`);
  redisClient = new Redis(redisOptions);

  redisClient.on('connect', () => {
    Logger.info('Redis client socket connected.');
  });

  redisClient.on('ready', () => {
    isRedisConnected = true;
    Logger.info('Redis client is ready for operations.');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    Logger.error('Redis client error event caught:', { error: err.message });
  });

  redisClient.on('close', () => {
    isRedisConnected = false;
    Logger.warn('Redis client connection closed.');
  });

  redisClient.on('reconnecting', (time) => {
    Logger.info(`Redis client reconnecting (attempt details: ${time}ms)...`);
  });

} catch (err) {
  Logger.error('Failed to instantiate Redis client instance:', { error: err.message });
}

export { redisClient };
export default redisClient;
