// src/rest-resources/routes/api/v1/blogs.routes.js
import { Router } from 'express';
import BlogsController from '@controllers/blogs.controller.js';
import asyncHandler from '@src/utils/async-handler.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';


const router = Router();
router.get(
  '/',
  contextMiddleware(false),
  asyncHandler(BlogsController.getAllUserBlogs)
);

router.get(
  '/:slug',
  contextMiddleware(false),
  asyncHandler(BlogsController.getBlogBySlug)
);


export default router;