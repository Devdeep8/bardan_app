import { BaseHandler } from '@src/libs/base.handler.js';
import { AppError } from '@src/errors/app.error.js';

export class TestTransactionHandler extends BaseHandler {
  /**
   * Validate incoming arguments.
   * Throws validation AppError if required fields are missing.
   */
  validateArgs(args) {
    const { email } = args;
    if (!email) {
      throw AppError.validation('Email is required', {
        validationErrors: [{ field: 'email', message: 'is required' }]
      });
    }
  }

  /**
   * Sanitize arguments for logging purposes.
   */
  static sanitizeArgs(args) {
    return { ...args };
  }

  /**
   * Core handler business logic execution.
   */
  async run() {
    const { email, shouldFail } = this.args;
    const { User } = this.context.models;
    
    // Create user utilizing the context's database transaction
    const user = await User.create({ email }, { transaction: this.dbTransaction });

    if (shouldFail === true || shouldFail === 'true') {
      this.logger.warn('Failing transaction intentionally as requested by args...');
      throw new Error('Intentional error to trigger automatic transaction rollback');
    }

    return {
      message: 'Transaction completed successfully',
      user,
      transactionStatus: this.getTransactionStatus()
    };
  }
}

export default TestTransactionHandler;
