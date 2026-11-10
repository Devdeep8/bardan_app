// src/libs/ajv.js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { AppError } from '@src/errors/app.error.js';

const ajv = new Ajv({
  allErrors: true,
  coerceTypes: true,      // Coerce query parameters and route parameters
  useDefaults: true,      // Apply default values defined in schemas
  removeAdditional: true  // Strip properties not defined in schemas for request body hygiene
});

addFormats(ajv);

export const validationService = {
  /**
   * Validates target data against a JSON schema
   * @param {Object} schema - JSON Schema
   * @param {Object} data - Request payload, query params, or route params
   * @returns {Object} Validated and coerced data
   * @throws {AppError} if validation fails
   */
  validateRequest: (schema, data) => {
    if (!schema || Object.keys(schema).length === 0) {
      return data;
    }

    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      const validationErrors = validate.errors.map(err => {
        const field = err.instancePath 
          ? err.instancePath.replace(/^\//, '').replace(/\//g, '.') 
          : err.params.missingProperty || 'field';
        return {
          field,
          message: err.message
        };
      });

      const firstError = validationErrors[0];
      const errorMessage = firstError 
        ? `Field "${firstError.field}" ${firstError.message}` 
        : 'Validation failed';

      throw AppError.validation(errorMessage, { validationErrors });
    }

    return data;
  }
};

export default validationService;
