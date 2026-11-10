// src/services/mandi/otp.service.js
// Phone OTP login codes, stored hashed in Redis.
// Provider is swappable (DevOtp now — free — SMS gateway later).
import crypto from 'crypto';
import { redisClient } from '@src/libs/redis.js';
import { Logger } from '@src/utils/logger.js';

const OTP_TTL_SECONDS = 5 * 60; // 5 minute expiry
const OTP_MAX_ATTEMPTS = 3;
const RESEND_COOLDOWN_SECONDS = 30;

const otpKey = (phone) => `mandi:otp:${phone}`;
const attemptsKey = (phone) => `mandi:otp-attempts:${phone}`;
const cooldownKey = (phone) => `mandi:otp-cooldown:${phone}`;

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * DevOtp provider: logs the code to the console. Costs nothing.
 * Swap for an SMS gateway by replacing this function.
 */
const devOtpProvider = {
  async send(phone, code) {
    Logger.info(`[DevOtp] OTP for +91${phone}: ${code}`);
  }
};

export const otpProvider = devOtpProvider;

export const OtpService = {
  /** Create (or re-create) an OTP for a phone. Throws on cooldown / rate limits. */
  async request(phone) {
    const cooldown = await redisClient.ttl(cooldownKey(phone));
    if (cooldown > 0) {
      const err = new Error(`RESEND_COOLDOWN:${cooldown}`);
      err.code = 'RESEND_COOLDOWN';
      throw err;
    }
    const code = String(crypto.randomInt(100000, 999999));
    const multi = redisClient.multi();
    multi.set(otpKey(phone), sha256(code), 'EX', OTP_TTL_SECONDS);
    multi.del(attemptsKey(phone));
    multi.set(cooldownKey(phone), '1', 'EX', RESEND_COOLDOWN_SECONDS);
    await multi.exec();
    await otpProvider.send(phone, code);
    return { expirySeconds: OTP_TTL_SECONDS };
  },

  /** Verify a code. Returns true/false; burns the code after success or max attempts. */
  async verify(phone, code) {
    const hash = await redisClient.get(otpKey(phone));
    if (!hash) return false;
    const attempts = Number(await redisClient.get(attemptsKey(phone)) || 0);
    if (attempts >= OTP_MAX_ATTEMPTS) return false;
    if (sha256(String(code)) !== hash) {
      await redisClient.incr(attemptsKey(phone));
      await redisClient.expire(attemptsKey(phone), OTP_TTL_SECONDS);
      return false;
    }
    await redisClient.del(otpKey(phone), attemptsKey(phone));
    return true;
  }
};
