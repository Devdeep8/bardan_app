import { BaseHandler } from "@src/libs/base.handler";
import { AppError } from '@src/errors/app.error.js';

export class GetBlogBySlugService extends BaseHandler {
  /**
   * Get a single published blog by slug.
   */
  async run() {
    const BLOG_AUTHOR_ATTRIBUTES = ['id', 'name', 'email', 'role'];
    const { Blog, AdminUser } = this.context.models;
    const { slug } = this.args;

    const blog = await Blog.findOne({
      where: {
        slug,
        status: "published"
      },
      include: [{
        model: AdminUser,
        as: 'author',
        attributes: BLOG_AUTHOR_ATTRIBUTES
      }]
    });

    if (!blog) {
      throw AppError.notFound('Blog not found', { meta: { slug } });
    }

    return blog;
  }
}
