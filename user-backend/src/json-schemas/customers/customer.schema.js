// src/json-schemas/customers/customer.schema.js
// Structural input hygiene only — the strict 10-digit phone rule lives in
// the service handler (customer.handler.js).

export const lookupCustomerSchema = {
  querySchema: {
    type: 'object',
    required: ['phone'],
    properties: {
      phone: { type: 'string', minLength: 1, maxLength: 20 }
    }
  }
};

export const listCustomersSchema = {
  querySchema: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      search: { type: 'string', maxLength: 100 }
    }
  }
};

export const listCustomerOrdersSchema = {
  paramsSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  },
  querySchema: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
    }
  }
};
