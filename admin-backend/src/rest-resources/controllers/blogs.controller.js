// BlogsController: handles blog endpoints, delegates business logic to handlers
import { sendResponse } from '@src/helpers/response.helpers.js';
import {
  GetBlogsHandler,
  GetBlogByIdHandler,
  CreateBlogHandler,
  UpdateBlogHandler,
  DeleteBlogHandler
} from '@src/services/blogs/blog.handler.js';

class BlogsController {
  /**
   * GET /api/v1/blogs
   * List blogs with pagination, status filter and title search.
   */
  static async getBlogs(req, res, next) {
    const result = await GetBlogsHandler.execute({ ...req.query }, req.context);
    sendResponse({ req, res, next }, result, 'Blogs retrieved successfully');
  }

  /**
   * GET /api/v1/blogs/:id
   */
  static async getBlogById(req, res, next) {
    const result = await GetBlogByIdHandler.execute({ ...req.params }, req.context);
    sendResponse({ req, res, next }, result, 'Blog retrieved successfully');
  }

  /**
   * POST /api/v1/blogs
   * authorId defaults to the authenticated admin.
   */
  static async createBlog(req, res, next) {
    const result = await CreateBlogHandler.execute(
      { authorId: req.context?.adminId, ...req.body },
      req.context
    );
    sendResponse({ req, res, next }, result, 'Blog created successfully');
  }

  /**
   * PUT /api/v1/blogs/:id
   */
  static async updateBlog(req, res, next) {
    const result = await UpdateBlogHandler.execute({ ...req.params, ...req.body }, req.context);
    sendResponse({ req, res, next }, result, 'Blog updated successfully');
  }

  /**
   * DELETE /api/v1/blogs/:id
   */
  static async deleteBlog(req, res, next) {
    const result = await DeleteBlogHandler.execute({ ...req.params }, req.context);
    sendResponse({ req, res, next }, result, 'Blog deleted successfully');
  }
}

export default BlogsController;
