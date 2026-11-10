// src/rest-resources/routes/api/v1/uploads.routes.js
import { Router } from 'express';
import { UploadsController, uploadImageFile } from '@controllers/uploads.controller.js';
import asyncHandler from '@src/utils/async-handler.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import isAdminAuthenticated from '@src/rest-resources/middlewares/isAdminAuthenticated.middleware.js';

const router = Router();

/**
 * @route   POST /api/v1/uploads/images
 * @desc    Upload an image to Cloudinary (multipart "file", max 5MB, jpg/png/webp)
 * @access  Private (Admin)
 */
router.post(
  '/images',
  contextMiddleware(),
  isAdminAuthenticated(),
  uploadImageFile,
  asyncHandler(UploadsController.uploadImage)
);

export default router;
