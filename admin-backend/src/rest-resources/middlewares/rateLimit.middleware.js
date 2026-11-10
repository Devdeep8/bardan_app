import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { redisClient } from '@src/libs/redis.js';
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';
import { Logger } from '@src/utils/logger.js';

/**
 * High-reliability Rate Limiting Middleware
 * Uses Redis as primary store, falling back to In-Memory if Redis is unavailable.
 * 
 * @param {object} [options={}]
 * @param {number} [options.points=100] - Total requests allowed in duration
 * @param {number} [options.duration=900] - Duration window in seconds (e.g., 900s = 15m)
 * @param {string} [options.keyPrefix='rl'] - Redis/Memory key prefix
 * @param {string} [options.errorMessage] - Custom rate limit exceeded error message
 * @returns {Function} Express middleware function
 */
export default function rateLimitMiddleware(options = {}) {
  const {
    points = 100,
    duration = 900,
    keyPrefix = 'rl',
    errorMessage = Errors.RATE_LIMIT_EXCEEDED.message
  } = options;

  // Initialize both limiters. Memory is always ready as a fallback.
  const memoryLimiter = new RateLimiterMemory({
    points,
    duration
  });

  let redisLimiter = null;

  const getRedisLimiter = () => {
    if (!redisLimiter && redisClient) {
      redisLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix,
        points,
        duration,
        // insuranceLimiter falls back to memory if Redis commands fail
        insuranceLimiter: memoryLimiter
      });
    }
    return redisLimiter;
  };

  return async (req, res, next) => {
    // Extract IP address from request context or object
    const ip = req.clientIp || req.ip || req.socket.remoteAddress;
    const rateLimitKey = `${keyPrefix}:${ip}`;

    // If client is a localhost internal/health-check call, skip rate limit
    if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
      if (req.url === '/health-check' || req.url === '/api/health-check') {
        return next();
      }
    }

    try {
      const activeRedisLimiter = getRedisLimiter();

      if (activeRedisLimiter && redisClient && redisClient.status === 'ready') {
        try {
          const rateLimiterRes = await activeRedisLimiter.consume(rateLimitKey);
          
          // Set X-RateLimit headers
          res.setHeader('X-RateLimit-Limit', points);
          res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
          res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
          
          return next();
        } catch (rejRes) {
          if (rejRes instanceof Error) {
            // Redis error event: fallback to memory limiter
            Logger.warn('Redis rate limiter failed. Falling back to memory limiter.', { error: rejRes.message });
          } else {
            // Rate limit exceeded
            res.setHeader('Retry-After', Math.ceil(rejRes.msBeforeNext / 1000));
            res.setHeader('X-RateLimit-Limit', points);
            res.setHeader('X-RateLimit-Remaining', 0);
            return next(AppError.rateLimit(errorMessage));
          }
        }
      }

      // In-Memory fallback path
      try {
        const rateLimiterRes = await memoryLimiter.consume(rateLimitKey);
        
        res.setHeader('X-RateLimit-Limit', points);
        res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
        
        return next();
      } catch (rejRes) {
        res.setHeader('Retry-After', Math.ceil(rejRes.msBeforeNext / 1000));
        res.setHeader('X-RateLimit-Limit', points);
        res.setHeader('X-RateLimit-Remaining', 0);
        return next(AppError.rateLimit(errorMessage));
      }
    } catch (err) {
      next(err);
    }
  };
}
