// src/json-schemas/expenses/expense.schema.js
// Structural input hygiene only — category/amount/date rules live in
// expense.handler.js.

const DATE_PATTERN = '^\\d{4}-\\d{2}-\\d{2}$'; // YYYY-MM-DD (shape only; validity checked in handler)

export const createExpenseSchema = {
  bodySchema: {
    type: 'object',
    required: ['category', 'amount'],
    additionalProperties: false,
    properties: {
      category: { type: 'string', maxLength: 20 },
      amount: { type: 'number', exclusiveMinimum: 0 },
      note: { type: 'string', maxLength: 500 },
      // Optional — the handler defaults it to today (business timezone)
      date: { type: 'string', pattern: DATE_PATTERN }
    }
  }
};

export const listExpensesSchema = {
  querySchema: {
    type: 'object',
    properties: {
      date: { type: 'string', pattern: DATE_PATTERN }
    }
  }
};

export const deleteExpenseSchema = {
  paramsSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  }
};
