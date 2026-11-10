// CustomersController: customer endpoints, delegates business logic to handlers
import { sendResponse } from '@src/helpers/response.helpers.js';
import {
  LookupCustomerHandler,
  ListCustomersHandler,
  ListCustomerOrdersHandler
} from '@src/services/customers/customer.handler.js';

class CustomersController {
  /** GET /api/v1/customers/lookup?phone=XXXX — autofill for the order form */
  static async lookup(req, res, next) {
    const result = await LookupCustomerHandler.execute({ ...req.query }, req.context);
    sendResponse({ req, res, next }, result, 'Customer retrieved successfully');
  }

  /** GET /api/v1/customers?page=&limit=&search= — paginated khata index */
  static async list(req, res, next) {
    const result = await ListCustomersHandler.execute({ ...req.query }, req.context);
    sendResponse({ req, res, next }, result, 'Customers retrieved successfully');
  }

  /** GET /api/v1/customers/:id/orders?page=&limit= — one customer's orders */
  static async listOrders(req, res, next) {
    const result = await ListCustomerOrdersHandler.execute(
      { ...req.params, ...req.query },
      req.context
    );
    sendResponse({ req, res, next }, result, 'Customer orders retrieved successfully');
  }
}

export default CustomersController;
