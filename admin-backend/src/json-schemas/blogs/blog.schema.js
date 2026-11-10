// src/json-schemas/blogs/blog.schema.js

const BLOG_STATUSES = ['draft', 'published', 'archived'];

// Inline image object stored in the blogs.images JSONB column
const blogImageSchema = {
  type: 'object',
  required: ['url'],
  additionalProperties: false,
  properties: {
    url: { type: 'string', minLength: 1, maxLength: 2048 },
    // Cloudinary public id — stored so updates can delete replaced assets
    publicId: { type: ['string', 'null'], maxLength: 300 },
    altText: { type: ['string', 'null'], maxLength: 300 },
    isCover: { type: 'boolean' },
    sortOrder: { type: 'integer', minimum: 0 }
  }
};

// Shared blog field definitions
const blogProperties = {
  title: { type: 'string', minLength: 1, maxLength: 200 },
  slug: { type: 'string', minLength: 1, maxLength: 220, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
  excerpt: { type: ['string', 'null'], maxLength: 1000 },
  content: { type: ['string', 'null'] },
  images: { type: 'array', items: blogImageSchema, maxItems: 30 },
  status: { type: 'string', enum: BLOG_STATUSES },
  authorId: { type: 'string', format: 'uuid' }
};

export const getBlogsSchema = {
  querySchema: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      status: { type: 'string', enum: BLOG_STATUSES },
      q: { type: 'string', maxLength: 200 }
    }
  }
};

export const getBlogByIdSchema = {
  paramsSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  }
};

export const createBlogSchema = {
  bodySchema: {
    type: 'object',
    required: ['title'],
    additionalProperties: false,
    properties: blogProperties
  }
};

export const updateBlogSchema = {
  paramsSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  },
  bodySchema: {
    type: 'object',
    minProperties: 1,
    additionalProperties: false,
    properties: blogProperties
  }
};
