// src/json-schemas/auth/auth.schema.js

export const adminLoginSchema = {
  bodySchema: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email', maxLength: 255 },
      password: { type: 'string', minLength: 8, maxLength: 128 }
    }
  }
};
