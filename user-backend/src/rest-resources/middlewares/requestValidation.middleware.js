// src/rest-resources/middlewares/requestValidation.middleware.js
import validationService from '@src/libs/ajv.js';

/**
 * REST request validation middleware
 * @param {Object} schemas - Validation schemas
 * @param {Object} [schemas.querySchema] - Query parameters schema
 * @param {Object} [schemas.paramsSchema] - Route parameters schema
 * @param {Object} [schemas.bodySchema] - Request body schema
 * @returns {Function} Express middleware
 */
export function requestValidationMiddleware (schemas = {}) {
  const { querySchema, paramsSchema, bodySchema } = schemas;
  return (req, _, next) => {
    try {
      if (querySchema) req.query = validationService.validateRequest(querySchema, req.query);
      if (paramsSchema) req.params = validationService.validateRequest(paramsSchema, req.params);
      if (bodySchema) req.body = validationService.validateRequest(bodySchema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default requestValidationMiddleware;
