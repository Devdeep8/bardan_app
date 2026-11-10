// src/rest-resources/routes/api/v1/blogs.routes.js
import { Router } from 'express';
import BlogsController from '@controllers/blogs.controller.js';
import asyncHandler from '@src/utils/async-handler.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import isAdminAuthenticated from '@src/rest-resources/middlewares/isAdminAuthenticated.middleware.js';
import requestValidationMiddleware from '@src/rest-resources/middlewares/requestValidation.middleware.js';
import {
  getBlogsSchema,
  getBlogByIdSchema,
  createBlogSchema,
  updateBlogSchema
} from '@src/json-schemas/blogs/blog.schema.js';

const router = Router();

/**
 * @route   GET /api/v1/blogs
 * @desc    List blogs (paginated, ?status= and ?q= title search)
 * @access  Public
 */
router.get(
  '/',
  contextMiddleware(),
  requestValidationMiddleware(getBlogsSchema),
  asyncHandler(BlogsController.getBlogs)
);

/**
 * @route   GET /api/v1/blogs/:id
 * @desc    Get blog by ID (includes author and inline images)
 * @access  Public
 */
router.get(
  '/:id',
  contextMiddleware(),
  requestValidationMiddleware(getBlogByIdSchema),
  asyncHandler(BlogsController.getBlogById)
);

/**
 * @route   POST /api/v1/blogs
 * @desc    Create a blog (runs in a DB transaction)
 * @access  Private (Admin)
 */
router.post(
  '/',
  contextMiddleware(true),
  isAdminAuthenticated(),
  requestValidationMiddleware(createBlogSchema),
  asyncHandler(BlogsController.createBlog)
);

/**
 * @route   PUT /api/v1/blogs/:id
 * @desc    Update a blog (runs in a DB transaction)
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  contextMiddleware(true),
  isAdminAuthenticated(),
  requestValidationMiddleware(updateBlogSchema),
  asyncHandler(BlogsController.updateBlog)
);

/**
 * @route   DELETE /api/v1/blogs/:id
 * @desc    Soft delete a blog (runs in a DB transaction)
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  contextMiddleware(true),
  isAdminAuthenticated(),
  requestValidationMiddleware(getBlogByIdSchema),
  asyncHandler(BlogsController.deleteBlog)
);

export default router;
