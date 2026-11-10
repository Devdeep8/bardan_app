// src/rest-resources/routes/api/v1/users.routes.js
import { Router } from 'express';
import UsersController from '@controllers/users.controller.js';
import asyncHandler from '@src/utils/async-handler.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import isAdminAuthenticated from '@src/rest-resources/middlewares/isAdminAuthenticated.middleware.js';
import requestValidationMiddleware from '@src/rest-resources/middlewares/requestValidation.middleware.js';
import {
  getUsersSchema,
  createUserSchema,
  getUserByIdSchema,
  updateUserSchema
} from '@src/json-schemas/users/user.schema.js';

const router = Router();

/**
 * @route   GET /api/v1/users
 * @desc    List user-backend app users (paginated, ?q= name/email search)
 * @access  Private (Admin)
 */
router.get(
  '/',
  contextMiddleware(),
  isAdminAuthenticated(),
  requestValidationMiddleware(getUsersSchema),
  asyncHandler(UsersController.getUsers)
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get app user by ID
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  contextMiddleware(),
  isAdminAuthenticated(),
  requestValidationMiddleware(getUserByIdSchema),
  asyncHandler(UsersController.getUserById)
);

/**
 * @route   POST /api/v1/users
 * @desc    Create an app user for the user backend (super admin only)
 * @access  Private (Super Admin)
 */
router.post(
  '/',
  contextMiddleware(true),
  isAdminAuthenticated(),
  requestValidationMiddleware(createUserSchema),
  asyncHandler(UsersController.createUser)
);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update an app user (super admin only)
 * @access  Private (Super Admin)
 */
router.patch(
  '/:id',
  contextMiddleware(true),
  isAdminAuthenticated(),
  requestValidationMiddleware(updateUserSchema),
  asyncHandler(UsersController.updateUser)
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete an app user (super admin only)
 * @access  Private (Super Admin)
 */
router.delete(
  '/:id',
  contextMiddleware(true),
  isAdminAuthenticated(),
  requestValidationMiddleware(getUserByIdSchema),
  asyncHandler(UsersController.deleteUser)
);

export default router;
