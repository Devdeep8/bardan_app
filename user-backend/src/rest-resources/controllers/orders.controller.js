// OrdersController: order endpoints, delegates business logic to handlers
import { sendResponse } from '@src/helpers/response.helpers.js';
import {
  CreateOrderHandler,
  ListOrdersHandler,
  GetOrderHandler,
  UpdateOrderReceivedHandler
} from '@src/services/orders/order.handler.js';
import { todayInBusinessTimeZone } from '@src/helpers/time.helpers.js';

class OrdersController {
  /** POST /api/v1/orders — find-or-create customer, then create the order */
  static async createOrder(req, res, next) {
    const result = await CreateOrderHandler.execute({ ...req.body }, req.context);
    sendResponse({ req, res, next }, result, 'Order created successfully');
  }

  /** GET /api/v1/orders?date=YYYY-MM-DD — one day of orders for the dashboard */
  static async listOrders(req, res, next) {
    const result = await ListOrdersHandler.execute(
      { date: req.query.date ?? todayInBusinessTimeZone() },
      req.context
    );
    sendResponse({ req, res, next }, result, 'Orders retrieved successfully');
  }

  /** GET /api/v1/orders/:id — single order with customer joined */
  static async getOrder(req, res, next) {
    const result = await GetOrderHandler.execute({ ...req.params }, req.context);
    sendResponse({ req, res, next }, result, 'Order retrieved successfully');
  }

  /** PATCH /api/v1/orders/:id — update amount_received, status recomputed */
  static async updateReceived(req, res, next) {
    const result = await UpdateOrderReceivedHandler.execute(
      { ...req.params, ...req.body },
      req.context
    );
    sendResponse({ req, res, next }, result, 'Order updated successfully');
  }
}

export default OrdersController;
