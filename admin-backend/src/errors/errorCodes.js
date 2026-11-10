// src/errors/errorCodes.js
import { StatusCodes } from 'http-status-codes';

export const Errors = {
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    name: 'InternalError',
    message: 'Internal server error',
    httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    severity: 'high',
    isCritical: true,
    retryable: false
  },
  INVALID_INPUT: {
    code: 'INVALID_INPUT',
    name: 'InvalidInput',
    message: 'Validation failed',
    httpStatusCode: StatusCodes.BAD_REQUEST,
    severity: 'low',
    isCritical: false,
    retryable: false
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    name: 'Unauthorized',
    message: 'Authentication required',
    httpStatusCode: StatusCodes.UNAUTHORIZED,
    severity: 'medium',
    isCritical: false,
    retryable: false
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    name: 'Forbidden',
    message: 'Access denied',
    httpStatusCode: StatusCodes.FORBIDDEN,
    severity: 'medium',
    isCritical: false,
    retryable: false
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    name: 'NotFound',
    message: 'Resource not found',
    httpStatusCode: StatusCodes.NOT_FOUND,
    severity: 'low',
    isCritical: false,
    retryable: false
  },
  CONFLICT: {
    code: 'CONFLICT',
    name: 'Conflict',
    message: 'Resource state conflict',
    httpStatusCode: StatusCodes.CONFLICT,
    severity: 'low',
    isCritical: false,
    retryable: false
  },
  EMAIL_ALREADY_EXISTS: {
    code: 'EMAIL_ALREADY_EXISTS',
    name: 'EmailAlreadyExists',
    message: 'The email address is already registered',
    httpStatusCode: StatusCodes.CONFLICT,
    severity: 'low',
    isCritical: false,
    retryable: false
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    name: 'InvalidCredentials',
    message: 'Invalid email or password',
    httpStatusCode: StatusCodes.UNAUTHORIZED,
    severity: 'medium',
    isCritical: false,
    retryable: false
  },
  SESSION_EXPIRED: {
    code: 'SESSION_EXPIRED',
    name: 'SessionExpired',
    message: 'Your session has expired',
    httpStatusCode: StatusCodes.UNAUTHORIZED,
    severity: 'low',
    isCritical: false,
    retryable: false
  },
  SESSION_HIJACK: {
    code: 'SESSION_HIJACK',
    name: 'SessionHijackDetected',
    message: 'Potential session hijack detected',
    httpStatusCode: StatusCodes.UNAUTHORIZED,
    severity: 'high',
    isCritical: true,
    retryable: false
  },
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    name: 'RateLimitExceeded',
    message: 'Too many requests, please try again later',
    httpStatusCode: StatusCodes.TOO_MANY_REQUESTS,
    severity: 'low',
    isCritical: false,
    retryable: true
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    name: 'TokenExpired',
    message: 'Token has expired',
    httpStatusCode: StatusCodes.UNAUTHORIZED,
    severity: 'low',
    isCritical: false,
    retryable: false
  },
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    name: 'InvalidToken',
    message: 'Invalid authorization token',
    httpStatusCode: StatusCodes.UNAUTHORIZED,
    severity: 'low',
    isCritical: false,
    retryable: false
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    name: 'DatabaseError',
    message: 'Database query execution failed',
    httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    severity: 'high',
    isCritical: true,
    retryable: false
  },
  TWO_FACTOR_REQUIRED: {
    code: 'TWO_FACTOR_REQUIRED',
    name: 'TwoFactorRequired',
    message: 'Two-factor authentication code required',
    httpStatusCode: StatusCodes.FORBIDDEN,
    severity: 'low',
    isCritical: false,
    retryable: false
  },
  TWO_FACTOR_INVALID: {
    code: 'TWO_FACTOR_INVALID',
    name: 'TwoFactorInvalid',
    message: 'Invalid two-factor authentication code',
    httpStatusCode: StatusCodes.BAD_REQUEST,
    severity: 'low',
    isCritical: false,
    retryable: false
  }
};

export default Errors;
