// AuthController: user authentication endpoints, delegates business logic to handlers
import config from '@configs/app.config.js';
import { sendResponse } from '@src/helpers/response.helpers.js';
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';
import {
  UserLoginHandler,
  RefreshUserTokenHandler,
  GetUserProfileHandler
} from '@src/services/auth/auth.handler.js';

const AUTH_COOKIES = {
  accessToken: 'user_access_token',
  refreshToken: 'user_refresh_token'
};

// '15m' / '7d' / '30s' -> milliseconds (for cookie maxAge)
const expiryToMaxAge = (expiry) => {
  const match = /^(\d+)([smhd])$/.exec(String(expiry));
  if (!match) return undefined;
  const units = { s: 1000, m: 60 * 1000, h: 3600 * 1000, d: 24 * 3600 * 1000 };
  return parseInt(match[1], 10) * units[match[2]];
};

// httpOnly cookies so browsers keep the tokens out of client-side JS.
// In production the frontend (Vercel) and backend (VPS) are cross-site,
// so browsers only accept the cookie with SameSite=None + Secure over HTTPS.
const isProd = config.get('env') === 'production';
const cookieBaseOptions = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/'
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(AUTH_COOKIES.accessToken, accessToken, {
    ...cookieBaseOptions(),
    maxAge: expiryToMaxAge(config.get('jwt.loginTokenExpiry'))
  });
  res.cookie(AUTH_COOKIES.refreshToken, refreshToken, {
    ...cookieBaseOptions(),
    maxAge: expiryToMaxAge(config.get('jwt.refreshTokenExpiry'))
  });
};

const clearAuthCookies = (res) => {
  Object.values(AUTH_COOKIES).forEach((name) => {
    res.clearCookie(name, cookieBaseOptions());
  });
};

class AuthController {
  /**
   * POST /api/v1/auth/login
   * Authenticate a user. Tokens are set as httpOnly cookies and
   * also returned in the body so non-browser clients can use them as Bearer.
   */
  static async login(req, res, next) {
    const result = await UserLoginHandler.execute({ ...req.body }, req.context);
    setAuthCookies(res, result);
    sendResponse({ req, res, next }, result, 'Logged in successfully');
  }

  /**
   * POST /api/v1/auth/refresh
   * Exchange the refresh cookie for a new token pair (cookies rotated).
   */
  static async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.[AUTH_COOKIES.refreshToken];
      if (!refreshToken) {
        throw new AppError(Errors.UNAUTHORIZED, { traceId: req.context?.traceId });
      }

      const result = await RefreshUserTokenHandler.execute({ refreshToken }, req.context);
      setAuthCookies(res, result);
      sendResponse({ req, res, next }, result, 'Token refreshed successfully');
    } catch (error) {
      // Refresh failed — the session is dead, drop the cookies too
      clearAuthCookies(res);
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Profile of the authenticated user.
   */
  static async getProfile(req, res, next) {
    const result = await GetUserProfileHandler.execute({}, req.context);
    sendResponse({ req, res, next }, result, 'Profile retrieved successfully');
  }

  /**
   * POST /api/v1/auth/logout
   * Clears the auth cookies (stateless JWT — no server session to revoke).
   */
  static async logout(req, res, next) {
    clearAuthCookies(res);
    sendResponse({ req, res, next }, {}, 'Logged out successfully');
  }
}

export default AuthController;
