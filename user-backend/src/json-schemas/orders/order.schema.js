// src/json-schemas/orders/order.schema.js
// Structural input hygiene only — business rules like the strict 10-digit
// phone live in the service handlers (order.handler.js / customer.handler.js).

const DATE_PATTERN = '^\\d{4}-\\d{2}-\\d{2}$'; // YYYY-MM-DD (shape only; validity checked in handler)

export const createOrderSchema = {
  bodySchema: {
    type: 'object',
    required: ['phone', 'name'],
    additionalProperties: false,
    properties: {
      phone: { type: 'string', minLength: 1, maxLength: 20 },
      name: { type: 'string', minLength: 1, maxLength: 255 },
      // Optional: when omitted the handler computes quantity × rate
      total_amount: { type: 'number', exclusiveMinimum: 0 },
      amount_received: { type: 'number', minimum: 0, default: 0 },
      village: { type: 'string', minLength: 1, maxLength: 100 },
      material: { type: 'string', maxLength: 10 },
      grade: { type: 'string', maxLength: 50 },
      quantity: { type: 'integer' },
      rate: { type: 'number' },
      payment_type: { type: 'string', maxLength: 10 },
      note: { type: 'string', maxLength: 500 },
      // Optional — the handler defaults it to today (business timezone)
      date: { type: 'string', pattern: DATE_PATTERN }
    }
  }
};

export const listOrdersSchema = {
  querySchema: {
    type: 'object',
    // Optional — the controller defaults it to today (UTC)
    properties: {
      date: { type: 'string', pattern: DATE_PATTERN }
    }
  }
};

export const getOrderSchema = {
  paramsSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  }
};

export const updateOrderSchema = {
  paramsSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  },
  bodySchema: {
    type: 'object',
    required: ['amount_received'],
    additionalProperties: false,
    properties: {
      amount_received: { type: 'number', minimum: 0 }
    }
  }
};
