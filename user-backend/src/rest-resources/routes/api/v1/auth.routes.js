// src/rest-resources/routes/api/v1/auth.routes.js
import { Router } from 'express';
import AuthController from '@controllers/auth.controller.js';
import asyncHandler from '@src/utils/async-handler.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import isUserAuthenticated from '@src/rest-resources/middlewares/isUserAuthenticated.middleware.js';
import rateLimitMiddleware from '@src/rest-resources/middlewares/rateLimit.middleware.js';
import requestValidationMiddleware from '@src/rest-resources/middlewares/requestValidation.middleware.js';
import { userLoginSchema } from '@src/json-schemas/auth/auth.schema.js';

const router = Router();

// Brute-force protection for credential endpoints: 10 attempts / 15 min per IP
const loginRateLimit = rateLimitMiddleware({
  points: 10,
  duration: 900,
  keyPrefix: 'rl_user_login',
  errorMessage: 'Too many login attempts. Please try again in a few minutes.'
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate a user and issue JWT tokens
 * @access  Public
 */
router.post(
  '/login',
  loginRateLimit,
  contextMiddleware(true),
  requestValidationMiddleware(userLoginSchema),
  asyncHandler(AuthController.login)
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Exchange the refresh cookie for a new token pair
 * @access  Public (refresh token)
 */
router.post(
  '/refresh',
  contextMiddleware(false),
  asyncHandler(AuthController.refresh)
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get the authenticated user profile
 * @access  Private (User)
 */
router.get(
  '/me',
  contextMiddleware(false),
  isUserAuthenticated(),
  asyncHandler(AuthController.getProfile)
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Log out (client discards tokens)
 * @access  Private (User)
 */
router.post(
  '/logout',
  contextMiddleware(false),
  isUserAuthenticated(),
  asyncHandler(AuthController.logout)
);

export default router;
