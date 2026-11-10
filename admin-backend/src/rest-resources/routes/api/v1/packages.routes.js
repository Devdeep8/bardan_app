// src/rest-resources/routes/api/v1/packages.routes.js
import { Router } from 'express';
import PackagesController from '@controllers/packages.controller.js';
import asyncHandler from '@src/utils/async-handler.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import requestValidationMiddleware from '@src/rest-resources/middlewares/requestValidation.middleware.js';
import {
  getPackagesSchema,
  getPackageByIdSchema,
  createPackageSchema,
  updatePackageSchema
} from '@src/json-schemas/packages/package.schema.js';

const router = Router();

/**
 * @route   GET /api/v1/packages
 * @desc    List packages (paginated, optional ?isActive= filter)
 * @access  Public
 */
router.get(
  '/',
  contextMiddleware(),
  requestValidationMiddleware(getPackagesSchema),
  asyncHandler(PackagesController.getPackages)
);

/**
 * @route   GET /api/v1/packages/:id
 * @desc    Get package by ID
 * @access  Public
 */
router.get(
  '/:id',
  contextMiddleware(),
  requestValidationMiddleware(getPackageByIdSchema),
  asyncHandler(PackagesController.getPackageById)
);

/**
 * @route   POST /api/v1/packages
 * @desc    Create a package (runs in a DB transaction)
 * @access  Private (Admin)
 */
router.post(
  '/',
  contextMiddleware(true),
  requestValidationMiddleware(createPackageSchema),
  asyncHandler(PackagesController.createPackage)
);

/**
 * @route   PUT /api/v1/packages/:id
 * @desc    Update a package (runs in a DB transaction)
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  contextMiddleware(true),
  requestValidationMiddleware(updatePackageSchema),
  asyncHandler(PackagesController.updatePackage)
);

/**
 * @route   DELETE /api/v1/packages/:id
 * @desc    Soft delete a package (runs in a DB transaction)
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  contextMiddleware(true),
  requestValidationMiddleware(getPackageByIdSchema),
  asyncHandler(PackagesController.deletePackage)
);

export default router;
