// src/rest-resources/middlewares/isMandiUserAuthenticated.middleware.js
// JWT auth for Mandi Trip users (farmers/drivers). Long-lived token from OTP login.
import jwt from 'jsonwebtoken';
import config from '@configs/app.config.js';
import db from '@src/db/models/index.js';
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';

const isMandiUserAuthenticated = () => async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : req.cookies?.mandi_access_token;

    if (!token) throw AppError.unauthorized('Mandi auth token missing');

    let payload;
    try {
      payload = jwt.verify(token, config.get('jwt.loginTokenSecret'));
    } catch {
      throw AppError(Errors.TOKEN_EXPIRED);
    }
    if (payload.type !== 'access' || payload.scope !== 'mandi') {
      throw AppError(Errors.INVALID_TOKEN);
    }

    const user = await db.MandiUser.findByPk(payload.sub);
    if (!user || !user.isActive) throw AppError.unauthorized('Mandi user not found or inactive');

    req.context.user = user;
    req.context.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
};

export default isMandiUserAuthenticated;
export { isMandiUserAuthenticated };
