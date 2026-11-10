// src/services/blogs/blog.handler.js
import { Op } from 'sequelize';
import { BaseHandler } from '@src/libs/base.handler.js';
import { AppError } from '@src/errors/app.error.js';
import { cloudinaryService } from '@src/utils/cloudinary.service.js';
import { emitEvent } from '@src/events/event.bus.js';
import { EVENTS } from '@src/events/event.types.js';

// Audit snapshot of the acting admin for entity lifecycle events
const auditActor = (context) => ({
  actorId: context?.adminId ?? null,
  actorType: context?.admin ? 'admin_user' : null,
  actorEmail: context?.admin?.email ?? null
});

const BLOG_AUTHOR_ATTRIBUTES = ['id', 'name', 'email', 'role'];

/**
 * Convert a title into a URL-friendly slug.
 */
const slugify = (text) => String(text)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/[\s_]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

/**
 * Normalize the inline images array: fill sort orders and ensure
 * at most one cover image.
 */
const normalizeImages = (images = []) => {
  let coverAssigned = false;

  return images.map((image, index) => {
    const isCover = image.isCover === true && !coverAssigned;
    if (isCover) coverAssigned = true;

    return {
      url: image.url,
      publicId: image.publicId || null,
      altText: image.altText || null,
      isCover,
      sortOrder: image.sortOrder ?? index
    };
  });
};

export class GetBlogsHandler extends BaseHandler {
  /**
   * List blogs with pagination, status filter and title search.
   */
  async run() {
    const { Blog, AdminUser } = this.context.models;
    const { page = 1, limit = 10, status, q } = this.args;

    const where = {};
    if (status) {
      where.status = status;
    }
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

export class GetBlogByIdHandler extends BaseHandler {
  async run() {
    const { Blog, AdminUser } = this.context.models;
    const { id } = this.args;

    const blog = await Blog.findByPk(id, {
      include: [{
        model: AdminUser,
        as: 'author',
        attributes: BLOG_AUTHOR_ATTRIBUTES
      }]
    });

    if (!blog) {
      throw AppError.notFound('Blog not found', { meta: { resourceId: id } });
    }

    return blog;
  }
}

export class CreateBlogHandler extends BaseHandler {
  static sanitizeArgs(args) {
    return { title: args.title, slug: args.slug, status: args.status, imageCount: args.images?.length || 0 };
  }

  /**
   * Generate a unique slug, appending -2, -3, ... on collisions.
   */
  async generateUniqueSlug(title) {
    const { Blog } = this.context.models;
    const base = slugify(title) || 'blog';
    let candidate = base;
    let suffix = 1;

    // paranoid: false so soft-deleted blogs still reserve their slug
    while (await Blog.findOne({ where: { slug: candidate }, paranoid: false, transaction: this.dbTransaction })) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    return candidate;
  }

  async run() {
    const { Blog, AdminUser } = this.context.models;
    const { title, slug, excerpt, content, images = [], status = 'draft', authorId } = this.args;

    if (authorId) {
      const author = await AdminUser.findByPk(authorId, { transaction: this.dbTransaction });
      if (!author) {
        throw AppError.notFound('Author not found', { meta: { resourceId: authorId } });
      }
    }

    let finalSlug;
    if (slug) {
      finalSlug = slug;
      const existing = await Blog.findOne({
        where: { slug: finalSlug },
        paranoid: false,
        transaction: this.dbTransaction
      });
      if (existing) {
        throw AppError.conflict('A blog with this slug already exists', { meta: { slug: finalSlug } });
      }
    } else {
      finalSlug = await this.generateUniqueSlug(title);
    }

    const blog = await Blog.create({
      title,
      slug: finalSlug,
      excerpt: excerpt ?? null,
      content: content ?? null,
      images: normalizeImages(images),
      status,
      authorId: authorId ?? null,
      publishedAt: status === 'published' ? new Date() : null
    }, { transaction: this.dbTransaction });

    this.logger.info('Blog created', {
      category: 'business',
      blogId: blog.id,
      slug: blog.slug,
      status: blog.status
    });

    emitEvent(EVENTS.ENTITY_CREATED, {
      ...auditActor(this.context),
      entity: 'blog',
      entityId: blog.id,
      after: blog.toJSON()
    }, this.context);

    return Blog.findByPk(blog.id, {
      include: [{
        model: AdminUser,
        as: 'author',
        attributes: BLOG_AUTHOR_ATTRIBUTES
      }],
      transaction: this.dbTransaction
    });
  }
}

export class UpdateBlogHandler extends BaseHandler {
  static sanitizeArgs(args) {
    return { id: args.id, fields: Object.keys(args).filter(key => key !== 'id') };
  }

  async run() {
    const { Blog, AdminUser } = this.context.models;
    const { id, ...updates } = this.args;

    const blog = await Blog.findByPk(id, { transaction: this.dbTransaction });
    if (!blog) {
      throw AppError.notFound('Blog not found', { meta: { resourceId: id } });
    }

    // Snapshot the pre-update state for the audit diff
    const previousBlog = blog.toJSON();

    // Snapshot the current images so we can clean up replaced ones after the update
    const previousImages = Array.isArray(blog.images) ? [...blog.images] : [];

    const patch = {};

    if (updates.title !== undefined) patch.title = updates.title;

    if (updates.slug !== undefined && updates.slug !== blog.slug) {
      const existing = await Blog.findOne({
        where: { slug: updates.slug, id: { [Op.ne]: id } },
        paranoid: false,
        transaction: this.dbTransaction
      });
      if (existing) {
        throw AppError.conflict('A blog with this slug already exists', { meta: { slug: updates.slug } });
      }
      patch.slug = updates.slug;
    }

    if (updates.excerpt !== undefined) patch.excerpt = updates.excerpt;
    if (updates.content !== undefined) patch.content = updates.content;
    if (updates.authorId !== undefined) patch.authorId = updates.authorId;
    if (updates.images !== undefined) patch.images = normalizeImages(updates.images);

    if (updates.status !== undefined) {
      patch.status = updates.status;
      // Stamp publishedAt the first time a blog is published
      if (updates.status === 'published' && !blog.publishedAt) {
        patch.publishedAt = new Date();
      }
    }

    await blog.update(patch, { transaction: this.dbTransaction });

    this.logger.info('Blog updated', {
      category: 'business',
      blogId: id,
      fields: Object.keys(patch)
    });

    emitEvent(EVENTS.ENTITY_UPDATED, {
      ...auditActor(this.context),
      entity: 'blog',
      entityId: id,
      before: previousBlog,
      after: blog.toJSON()
    }, this.context);

    // Images were replaced -> delete the removed ones from Cloudinary.
    // Runs after the DB update and never throws (cleanup must not fail the update).
    if (updates.images !== undefined) {
      try {
        await cloudinaryService.deleteRemovedImages(previousImages, updates.images || []);
      } catch (error) {
        this.logger.warn('Cloudinary cleanup after blog update failed', {
          blogId: id,
          error: error.message
        });
      }
    }

    return Blog.findByPk(id, {
      include: [{
        model: AdminUser,
        as: 'author',
        attributes: BLOG_AUTHOR_ATTRIBUTES
      }],
      transaction: this.dbTransaction
    });
  }
}

export class DeleteBlogHandler extends BaseHandler {
  async run() {
    const { Blog } = this.context.models;
    const { id } = this.args;

    const blog = await Blog.findByPk(id, { transaction: this.dbTransaction });
    if (!blog) {
      throw AppError.notFound('Blog not found', { meta: { resourceId: id } });
    }

    // Soft delete (paranoid model)
    await blog.destroy({ transaction: this.dbTransaction });

    this.logger.info('Blog soft-deleted', {
      category: 'business',
      blogId: id
    });

    emitEvent(EVENTS.ENTITY_DELETED, {
      ...auditActor(this.context),
      entity: 'blog',
      entityId: id,
      before: blog.toJSON()
    }, this.context);

    return { id, deleted: true };
  }
}
