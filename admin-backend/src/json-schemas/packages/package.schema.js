// src/json-schemas/packages/package.schema.js

// Shared package field definitions
const packageProperties = {
  name: { type: 'string', minLength: 1, maxLength: 100 },
  title: { type: 'string', minLength: 1, maxLength: 150 },
  description: { type: ['string', 'null'], maxLength: 10000 },
  duration: { type: ['string', 'null'], maxLength: 100 },
  capacity: { type: ['string', 'null'], maxLength: 100 },
  price: { type: ['string', 'null'], maxLength: 50 },
  priceUnit: { type: ['string', 'null'], maxLength: 50 },
  highlights: { type: 'array', items: { type: 'string', maxLength: 300 }, maxItems: 50 },
  gradient: { type: ['string', 'null'], maxLength: 200 },
  icon: { type: ['string', 'null'], maxLength: 200 },
  isActive: { type: 'boolean' },
  sortOrder: { type: 'integer', minimum: 0 }
};

export const getPackagesSchema = {
  querySchema: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      isActive: { type: 'boolean' }
    }
  }
};

export const getPackageByIdSchema = {
  paramsSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 }
    }
  }
};

export const createPackageSchema = {
  bodySchema: {
    type: 'object',
    required: ['name', 'title'],
    additionalProperties: false,
    properties: packageProperties
  }
};

export const updatePackageSchema = {
  paramsSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 }
    }
  },
  bodySchema: {
    type: 'object',
    minProperties: 1,
    additionalProperties: false,
    properties: packageProperties
  }
};
