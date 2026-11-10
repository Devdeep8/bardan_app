import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';
import dayjs from 'dayjs';
import { Logger } from '@src/utils/logger.js';

/**
 * @class BaseHandler
 * @description
 * Base class for handling business logic with centralized logging and error management.
 * Provides structured execution workflow with consistent logging, error handling, and context management.
 * Transaction management is handled at the middleware level, not within handlers.
 *
 * @property {Object} args - Input parameters for the handler
 * @property {Object} context - Request context including logger, traceId, and transaction
 * @property {Object} dbTransaction - Database transaction instance from context (if available)
 * @property {Object} logger - Contextual logger with traceId
 */
export class BaseHandler {
  /**
   * @constructor
   * @param {Object} [args={}] - Input parameters for the handler
   * @param {Object} [context={}] - Request context with logger, traceId, transaction, etc.
   */
  constructor(args = {}, context = {}) {
    this.args = args;
    this.context = context;
    this.dbTransaction = context.transaction || context.sequelizeTransaction;
    this.t = this.dbTransaction;
    this.logger = context.logger || Logger;
    this.traceId = context.traceId;
  }

  /**
   * @static
   * @async
   * @method execute
   * @description
   * Instantiates the handler and runs the `run()` method with enhanced logging and error handling.
   * Transaction management is handled by middleware, not within the handler.
   * @param {Object} [args={}] - Input parameters
   * @param {Object} [context={}] - Request context with logger, traceId, transaction, etc.
   * @returns {Promise<*>} - Returns the result of the `run()` method
   * @throws {AppError} - Throws AppError for consistent error handling
   */
  static async execute(args = {}, context = {}) {
    const startTime = dayjs();
    const handlerName = this.name;
    const instance = new this(args, context);
    const logger = instance.logger;

    try {
      logger.info(`Handler execution started: ${handlerName}`, {
        handler: handlerName,
        args: this.sanitizeArgs ? this.sanitizeArgs(args) : args,
        traceId: instance.traceId,
        hasTransaction: !!instance.dbTransaction
      });

      const result = await instance.run();

      const duration = dayjs().diff(startTime);
      logger.info(`Handler execution completed: ${handlerName} (${duration}ms)`, {
        handler: handlerName,
        duration,
        traceId: instance.traceId
      });

      return result;
    } catch (error) {
      const duration = dayjs().diff(startTime);

      logger.error(`Handler execution failed: ${handlerName} (${duration}ms)`, {
        handler: handlerName,
        duration: `${duration}ms`,
        traceId: instance.traceId,
        error: error instanceof Error
          ? { name: error.name, message: error.message, code: error.code || null, stack: error.stack }
          : { raw: JSON.stringify(error) } // safe fallback
      });
      // Mark transaction for rollback if needed
      if (instance.context && instance.context.markTransactionForRollback) {
        instance.context.markTransactionForRollback();
      }

      throw error instanceof AppError
        ? error
        : new AppError(Errors.INTERNAL_ERROR, {
          traceId: instance.traceId,
          message: `Handler ${handlerName} failed: ${error?.message || 'Unknown error'}`
        });
    }
  }

  /**
   * @async
   * @method run
   * @description
   * This method must be implemented by subclasses to define the core business logic.
   * @throws {AppError} - Throws AppError if not implemented in the subclass
   */
  async run() {
    throw new AppError(Errors.INTERNAL_ERROR, {
      traceId: this.traceId,
      message: `The run() method must be implemented in ${this.constructor.name} subclass`
    });
  }

  // Call another service (shares same transaction/context)
  async callHandler(HandlerClass, args = {}) {
    return await HandlerClass.execute(args, this.context);
  }

  /**
   * @method validateArgs
   * @description
   * Optional method to validate handler arguments. Override in subclasses.
   * @param {Object} args - Arguments to validate
   * @throws {AppError} - Throws validation error if args are invalid
   */
  validateArgs(args) {
    // Override in subclasses for specific validation logic
  }

  /**
   * @static
   * @method sanitizeArgs
   * @description
   * Optional method to sanitize arguments for logging. Override in subclasses.
   * @param {Object} args - Arguments to sanitize
   * @returns {Object} - Sanitized arguments safe for logging
   */
  static sanitizeArgs(args) {
    // Override in subclasses to remove sensitive data from logs
    return args;
  }

  /**
   * @method getTransactionStatus
   * @description
   * Gets current transaction status if available
   * @returns {Object|null} - Transaction status or null if no transaction
   */
  getTransactionStatus() {
    return this.context.getTransactionStatus ? this.context.getTransactionStatus() : null;
  }
}

/**
 * BaseHandler that automatically validates arguments
 */
export class ValidatedBaseHandler extends BaseHandler {
  static async execute(args = {}, context = {}) {
    const instance = new this(args, context);

    // Validate arguments before execution
    if (instance.validateArgs) {
      instance.validateArgs(args);
    }

    return super.execute(args, context);
  }
}
