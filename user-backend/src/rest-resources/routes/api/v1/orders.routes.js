// src/rest-resources/routes/api/v1/orders.routes.js
import { Router } from 'express';
import OrdersController from '@controllers/orders.controller.js';
import asyncHandler from '@src/utils/async-handler.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import isUserAuthenticated from '@src/rest-resources/middlewares/isUserAuthenticated.middleware.js';
import requestValidationMiddleware from '@src/rest-resources/middlewares/requestValidation.middleware.js';
import {
  createOrderSchema,
  listOrdersSchema,
  getOrderSchema,
  updateOrderSchema
} from '@src/json-schemas/orders/order.schema.js';

const router = Router();

/**
 * @route   POST /api/v1/orders
 * @desc    Create an order (find-or-create customer by phone, auto order_no)
 * @access  Private — wraps customer + order writes in one transaction
 */
router.post(
  '/',
  contextMiddleware(true),
  isUserAuthenticated(),
  requestValidationMiddleware(createOrderSchema),
  asyncHandler(OrdersController.createOrder)
);

/**
 * @route   GET /api/v1/orders?date=YYYY-MM-DD
 * @desc    List a day's orders with customer name/phone joined
 * @access  Private (read — no transaction)
 */
router.get(
  '/',
  contextMiddleware(false),
  isUserAuthenticated(),
  requestValidationMiddleware(listOrdersSchema),
  asyncHandler(OrdersController.listOrders)
);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Single order with customer joined
 * @access  Private (read — no transaction)
 */
router.get(
  '/:id',
  contextMiddleware(false),
  isUserAuthenticated(),
  requestValidationMiddleware(getOrderSchema),
  asyncHandler(OrdersController.getOrder)
);

/**
 * @route   PATCH /api/v1/orders/:id
 * @desc    Update amount_received (status recomputed server-side)
 * @access  Private
 */
router.patch(
  '/:id',
  contextMiddleware(true),
  isUserAuthenticated(),
  requestValidationMiddleware(updateOrderSchema),
  asyncHandler(OrdersController.updateReceived)
);

export default router;
