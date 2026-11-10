// src/rest-resources/routes/api/v1/customers.routes.js
import { Router } from 'express';
import CustomersController from '@controllers/customers.controller.js';
import asyncHandler from '@src/utils/async-handler.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import isUserAuthenticated from '@src/rest-resources/middlewares/isUserAuthenticated.middleware.js';
import requestValidationMiddleware from '@src/rest-resources/middlewares/requestValidation.middleware.js';
import {
  lookupCustomerSchema,
  listCustomersSchema,
  listCustomerOrdersSchema
} from '@src/json-schemas/customers/customer.schema.js';

const router = Router();

/**
 * @route   GET /api/v1/customers/lookup?phone=XXXX
 * @desc    Order-form autofill: known customer's name + preferred_language + last order
 * @access  Private (read — no transaction)
 */
router.get(
  '/lookup',
  contextMiddleware(false),
  isUserAuthenticated(),
  requestValidationMiddleware(lookupCustomerSchema),
  asyncHandler(CustomersController.lookup)
);

/**
 * @route   GET /api/v1/customers?page=1&limit=20&search=
 * @desc    Khata index: paginated customers with order stats
 * @access  Private (read — no transaction)
 */
router.get(
  '/',
  contextMiddleware(false),
  isUserAuthenticated(),
  requestValidationMiddleware(listCustomersSchema),
  asyncHandler(CustomersController.list)
);

/**
 * @route   GET /api/v1/customers/:id/orders?page=1&limit=10
 * @desc    One customer's order history, newest first, paginated
 * @access  Private (read — no transaction)
 */
router.get(
  '/:id/orders',
  contextMiddleware(false),
  isUserAuthenticated(),
  requestValidationMiddleware(listCustomerOrdersSchema),
  asyncHandler(CustomersController.listOrders)
);

export default router;
