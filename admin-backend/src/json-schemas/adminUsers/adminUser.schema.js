// src/json-schemas/adminUsers/adminUser.schema.js
const ROLES = ['super_admin', 'admin', 'editor'];

const emailProperty = { type: 'string', format: 'email', maxLength: 200 };

export const getAdminUsersSchema = {
  querySchema: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      q: { type: 'string', maxLength: 200 }
    }
  }
};

export const createAdminUserSchema = {
  bodySchema: {
    type: 'object',
    required: ['name', 'email', 'password', 'role'],
    additionalProperties: false,
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      email: emailProperty,
      password: { type: 'string', minLength: 8, maxLength: 100 },
      role: { type: 'string', enum: ROLES }
    }
  }
};

export const getAdminUserByIdSchema = {
  paramsSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  }
};

export const updateAdminUserSchema = {
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
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      email: emailProperty,
      password: { type: 'string', minLength: 8, maxLength: 100 },
      role: { type: 'string', enum: ROLES },
      isActive: { type: 'boolean' }
    }
  }
};
