// src/utils/async-handler.js
/**
 * Wraps asynchronous Express route handlers to automatically catch any rejected promises
 * and forward them to the next() error handling middleware, preventing unhandled rejection crashes.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
