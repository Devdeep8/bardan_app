// src/rest-resources/routes/api/v1/adminUsers.routes.js
import { Router } from 'express';
import AdminUsersController from '@controllers/adminUsers.controller.js';
import asyncHandler from '@src/utils/async-handler.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import isAdminAuthenticated from '@src/rest-resources/middlewares/isAdminAuthenticated.middleware.js';
import requestValidationMiddleware from '@src/rest-resources/middlewares/requestValidation.middleware.js';
import {
  getAdminUsersSchema,
  createAdminUserSchema,
  getAdminUserByIdSchema,
  updateAdminUserSchema
} from '@src/json-schemas/adminUsers/adminUser.schema.js';

const router = Router();

/**
 * @route   GET /api/v1/admin-users
 * @desc    List admin users (paginated, ?q= name/email search)
 * @access  Private (Admin)
 */
router.get(
  '/',
  contextMiddleware(),
  isAdminAuthenticated(),
  requestValidationMiddleware(getAdminUsersSchema),
  asyncHandler(AdminUsersController.getAdminUsers)
);

/**
 * @route   GET /api/v1/admin-users/:id
 * @desc    Get admin user by ID
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  contextMiddleware(),
  isAdminAuthenticated(),
  requestValidationMiddleware(getAdminUserByIdSchema),
  asyncHandler(AdminUsersController.getAdminUserById)
);

/**
 * @route   POST /api/v1/admin-users
 * @desc    Create an admin user (super admin only, checked in handler)
 * @access  Private (Super Admin)
 */
router.post(
  '/',
  contextMiddleware(true),
  isAdminAuthenticated(),
  requestValidationMiddleware(createAdminUserSchema),
  asyncHandler(AdminUsersController.createAdminUser)
);

/**
 * @route   PATCH /api/v1/admin-users/:id
 * @desc    Update an admin user (super admin only, checked in handler)
 * @access  Private (Super Admin)
 */
router.patch(
  '/:id',
  contextMiddleware(true),
  isAdminAuthenticated(),
  requestValidationMiddleware(updateAdminUserSchema),
  asyncHandler(AdminUsersController.updateAdminUser)
);

/**
 * @route   DELETE /api/v1/admin-users/:id
 * @desc    Delete an admin user (super admin only, checked in handler)
 * @access  Private (Super Admin)
 */
router.delete(
  '/:id',
  contextMiddleware(true),
  isAdminAuthenticated(),
  requestValidationMiddleware(getAdminUserByIdSchema),
  asyncHandler(AdminUsersController.deleteAdminUser)
);

export default router;
