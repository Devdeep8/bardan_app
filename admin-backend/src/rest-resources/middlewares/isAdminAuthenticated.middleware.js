// src/rest-resources/middlewares/isAdminAuthenticated.middleware.js
import jwt from 'jsonwebtoken';
import config from '@configs/app.config.js';
import db from '@src/db/models/index.js';
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';

const BEARER_REGEX = /^Bearer\s+/i;
const ACCESS_TOKEN_COOKIE = 'admin_access_token';

// Prefer the explicit Authorization header (API clients), fall back to the
// httpOnly cookie set at login (browser flows).
const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && BEARER_REGEX.test(header)) {
    return header.replace(BEARER_REGEX, '').trim();
  }
  return req.cookies?.[ACCESS_TOKEN_COOKIE] || null;
};

/**
 * JWT authentication middleware for admin routes.
 * Verifies the Authorization: Bearer <accessToken> header, loads the admin
 * user and attaches it to req.context. Must run AFTER contextMiddleware.
 *
 * @returns {Function} Express middleware function
 */
export default function isAdminAuthenticated () {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token) {
        throw new AppError(Errors.UNAUTHORIZED, { traceId: req.traceId });
      }

      let payload;
      try {
        payload = jwt.verify(token, config.get('jwt.loginTokenSecret'));
      } catch (error) {
        const errorCode = error.name === 'TokenExpiredError'
          ? Errors.TOKEN_EXPIRED
          : Errors.INVALID_TOKEN;
        throw new AppError(errorCode, { traceId: req.traceId });
      }

      if (payload.type !== 'access') {
        throw new AppError(Errors.INVALID_TOKEN, { traceId: req.traceId });
      }

      const admin = await db.AdminUser.findByPk(payload.sub);
      if (!admin || !admin.isActive) {
        throw new AppError(Errors.UNAUTHORIZED, { traceId: req.traceId });
      }

      req.context.admin = admin;
      req.context.adminId = admin.id;
      next();
    } catch (error) {
      next(error);
    }
  };
}
