import { sendResponse } from '@src/helpers/response.helpers.js';
import { GetAllUserBlogsService } from '@src/services/blogs/getAllUserBlogs.service.js';
import { GetBlogBySlugService } from '@src/services/blogs/getBlogBySlug.service.js';

class BlogsController {
    static async getAllUserBlogs(req, res , next) {
        // Implementation for getting all user blogs
        const result = await GetAllUserBlogsService.execute({ ...req.query }, req.context);
        sendResponse({ req, res, next }, result, 'Blogs retrieved successfully');
    }

    static async getBlogBySlug(req, res, next) {
        const result = await GetBlogBySlugService.execute({ ...req.params }, req.context);
        sendResponse({ req, res, next }, result, 'Blog retrieved successfully');
    }
}


export default BlogsController;