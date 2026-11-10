// src/json-schemas/users/user.schema.js
const emailProperty = { type: 'string', format: 'email', maxLength: 200 };

export const getUsersSchema = {
  querySchema: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      q: { type: 'string', maxLength: 200 }
    }
  }
};

export const createUserSchema = {
  bodySchema: {
    type: 'object',
    required: ['name', 'email', 'password'],
    additionalProperties: false,
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      email: emailProperty,
      password: { type: 'string', minLength: 8, maxLength: 100 },
      isActive: { type: 'boolean' }
    }
  }
};

export const getUserByIdSchema = {
  paramsSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  }
};

export const updateUserSchema = {
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
      isActive: { type: 'boolean' }
    }
  }
};
