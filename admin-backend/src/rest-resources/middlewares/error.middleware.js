// src/rest-resources/middlewares/error.middleware.js
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@src/errors/app.error.js';

/**
 * Global Express error handling middleware.
 * Prevents the application from crashing when an error is thrown in a route handler,
 * logs the details, and returns a clean JSON error response.
 */
export const errorMiddleware = (err, req, res, next) => {
  let appError;

  if (err instanceof AppError) {
    appError = err;
  } else {
    // Wrap generic error inside AppError.internal
    appError = AppError.internal(err.message || 'Internal Server Error', {
      originalError: err,
      statusCode: err.statusCode || err.status || StatusCodes.INTERNAL_SERVER_ERROR
    });
  }

  // Inject request trace ID if not already present
  if (!appError.traceId && req.traceId) {
    appError.traceId = req.traceId;
  }

  // Use the request-specific logger if available, otherwise fallback to console
  if (req.logger) {
    req.logger.error(`Unhandled error caught: ${appError.message}`, {
      err: appError.getLogData(),
      category: 'system'
    });
  } else {
    console.error('Unhandled error caught:', appError.getLogData());
  }

  res.status(appError.httpStatusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(appError.toAPIResponse());
};

export default errorMiddleware;
