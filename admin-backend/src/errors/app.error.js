// src/errors/app.error.js
import Errors from './errorCodes.js';

/**
 * A custom error class for handling specific errors with detailed context and validation.
 * Extends the native JavaScript `Error` class to include additional metadata such as HTTP status codes,
 * severity, retryability, and details.
 *
 * @class AppError
 * @extends Error
 */
export class AppError extends Error {
  /**
   * Creates an instance of AppError.
   *
   * @constructor
   * @param {Object} errorObj - The error object from the `Errors` module containing error details.
   */
  constructor (errorObj, context = {}) {
    super(context.message || errorObj.message);

    this.code = errorObj.code;
    this.name = errorObj.name;
    this.message = context.message || errorObj.message;
    this.httpStatusCode = errorObj.httpStatusCode;
    this.severity = errorObj.severity;
    this.isCritical = errorObj.isCritical;
    this.retryable = errorObj.retryable;

    // Request context
    this.traceId = context.traceId || context.reqId || null;
    this.requestId = context.requestId || context.reqId || null;
    this.userId = context.userId || null;
    this.sessionId = context.sessionId || null;
    this.ip = context.ip || null;

    // Validation context
    this.field = context.field || null;
    this.value = context.value || null;
    this.validationErrors = context.validationErrors || null;

    // Gaming/Monetary context
    this.gameId = context.gameId || null;
    this.roundId = context.roundId || null;
    this.transactionId = context.transactionId || null;
    this.amount = context.amount || null;
    this.currency = context.currency || null;

    // Additional metadata
    this.meta = context.meta || {};
    this.originalError = context.originalError || null;

    // Timestamps
    this.timestamp = new Date().toISOString();
    this.occurred = Date.now();

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Generates an industry-standard API response object for this error.
   */
  toAPIResponse () {
    return {
      success: false,
      timestamp: this.timestamp,
      traceId: this.traceId,
      errors: {
        code: this.code,
        statusCode: this.httpStatusCode,
        name: this.name,
        message: this.message,
        severity: this.severity,
        retryable: this.retryable,
        ...(this.field && { field: this.field }),
        ...(this.validationErrors && { details: this.validationErrors })
      }
    };
  }

  /**
   * Returns structured data for logging the error, including all relevant context.
   */
  getLogData () {
    return {
      errorCode: this.code,
      errorName: this.name,
      message: this.message,
      severity: this.severity,
      isCritical: this.isCritical,
      httpStatusCode: this.httpStatusCode,
      traceId: this.traceId,
      userId: this.userId,
      gameId: this.gameId,
      transactionId: this.transactionId,
      amount: this.amount,
      currency: this.currency,
      field: this.field,
      timestamp: this.timestamp,
      stack: this.stack,
      meta: this.meta,
      ...(this.originalError && {
        originalError: this.originalError.message || this.originalError
      })
    };
  }

  /**
   * Determines if the error represents a security incident.
   */
  isSecurityIncident () {
    const securityCodes = ['SESSION_HIJACK', 'BRUTE_FORCE', 'FRAUD_DETECTED'];
    return securityCodes.includes(this.code) ||
      (this.meta && this.meta.securityFlags && this.meta.securityFlags.length > 0);
  }

  /**
   * Static factory method to create an internal server error.
   */
  static internal (message = 'Internal server error', details = {}) {
    return new AppError(Errors.INTERNAL_ERROR, { message, ...details });
  }

  /**
   * Static factory method to create a validation error.
   */
  static validation (message = 'Validation failed', details = {}) {
    return new AppError(Errors.INVALID_INPUT, {
      message,
      validationErrors: details.validationErrors,
      ...details
    });
  }

  /**
   * Static factory method to create a not found error.
   */
  static notFound (message = 'Resource not found', details = {}) {
    return new AppError(Errors.NOT_FOUND, { message, ...details });
  }

  /**
   * Static factory method to create an unauthorized error.
   */
  static unauthorized (message = 'Authentication required', details = {}) {
    return new AppError(Errors.UNAUTHORIZED, { message, ...details });
  }

  /**
   * Static factory method to create a forbidden error.
   */
  static forbidden (message = 'Access denied', details = {}) {
    return new AppError(Errors.FORBIDDEN, { message, ...details });
  }

  /**
   * Static factory method to create a conflict error.
   */
  static conflict (message = 'Resource state conflict', details = {}) {
    return new AppError(Errors.CONFLICT, { message, ...details });
  }

  /**
   * Static factory method to create a bad request error.
   */
  static badRequest (message = 'Validation failed', details = {}) {
    return new AppError(Errors.INVALID_INPUT, { message, ...details });
  }

  /**
   * Static factory method to create a rate limit exceeded error.
   */
  static rateLimit (message = 'Too many requests, please try again later', details = {}) {
    return new AppError(Errors.RATE_LIMIT_EXCEEDED, { message, ...details });
  }

  /**
   * Static factory method to create a 2FA required error.
   */
  static twoFactorRequired (message = 'Two-factor authentication code required', details = {}) {
    return new AppError(Errors.TWO_FACTOR_REQUIRED, { message, ...details });
  }

  /**
   * Static factory method to create a 2FA invalid error.
   */
  static twoFactorInvalid (message = 'Invalid two-factor authentication code', details = {}) {
    return new AppError(Errors.TWO_FACTOR_INVALID, { message, ...details });
  }
}
export default AppError;
