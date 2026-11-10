// src/json-schemas/demo/validateTest.schema.js
export const validateTestSchema = {
  bodySchema: {
    type: 'object',
    required: ['email', 'age'],
    properties: {
      email: { type: 'string', format: 'email' },
      age: { type: 'integer', minimum: 18 }
    }
  }
};

export default validateTestSchema;
