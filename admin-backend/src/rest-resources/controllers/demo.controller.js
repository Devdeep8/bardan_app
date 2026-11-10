// DemoController: handles demo endpoint logic
import { sendResponse } from '@src/helpers/response.helpers.js';
import TestTransactionHandler from '@src/services/demo/testTransaction.handler.js';

class DemoController {
  /**
   * GET /demo
   * Returns a simple JSON response.
   */
  static async getDemo(req, res, next) {
    const result = { 
      message: 'Demo endpoint works!', 
      traceId: req.traceId
    };
    
    sendResponse({ req, res, next }, result);
  }

  /**
   * GET /crash
   * Simulates a service failure to show the app doesn't crash.
   */
  static async getCrash(req, res) {
    req.logger.info('Simulating a service crash/error...');
    throw new Error('Oops! Something went wrong in this service.');
  }

  /**
   * POST /transaction-test
   * Demonstrates automatic Sequelize transactions via contextMiddleware.
   */
  static async transactionTest(req, res, next) {
    const result = await TestTransactionHandler.execute(req.body, req.context);
    sendResponse({ req, res, next }, result);
  }
}

export default DemoController;
