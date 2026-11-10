import { BaseHandler } from "@src/libs/base.handler"
import { Op } from 'sequelize';

export class GetAllUserBlogsService extends BaseHandler {
  /**
   * List blogs with pagination, status filter and title search.
   */

  async run() {
    const  BLOG_AUTHOR_ATTRIBUTES = ['id', 'name', 'email', 'role'];

    const { Blog, AdminUser } = this.context.models;
    const { page = 1, limit = 10, q } = this.args;

    const where = {};

    where.status = "published";


    if (q) {
      where.title = { [Op.iLike]: `%${q}%` };
    }

    const { rows, count } = await Blog.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      distinct: true,
      include: [{
        model: AdminUser,
        as: 'author',
        attributes: BLOG_AUTHOR_ATTRIBUTES
      }]
    });

    return {
      items: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}