import { Router } from 'express';
import ExpensesController from '@controllers/expenses.controller.js';
import asyncHandler from '@src/utils/async-handler.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import isUserAuthenticated from '@src/rest-resources/middlewares/isUserAuthenticated.middleware.js';
import requestValidationMiddleware from '@src/rest-resources/middlewares/requestValidation.middleware.js';
import {
  createExpenseSchema,
  listExpensesSchema,
  deleteExpenseSchema
} from '@src/json-schemas/expenses/expense.schema.js';

const router = Router();

/**
 * @route   POST /api/v1/expenses
 * @desc    Record a daily expense entry (diesel, operation, …; date defaults to today)
 * @access  Private — write, one transaction
 */
router.post(
  '/',
  contextMiddleware(true),
  isUserAuthenticated(),
  requestValidationMiddleware(createExpenseSchema),
  asyncHandler(ExpensesController.createExpense)
);

/**
 * @route   GET /api/v1/expenses?date=YYYY-MM-DD
 * @desc    One day's expense entries + total
 * @access  Private (read — no transaction)
 */
router.get(
  '/',
  contextMiddleware(false),
  isUserAuthenticated(),
  requestValidationMiddleware(listExpensesSchema),
  asyncHandler(ExpensesController.listExpenses)
);

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Remove a mistyped expense entry
 * @access  Private — write, one transaction
 */
router.delete(
  '/:id',
  contextMiddleware(true),
  isUserAuthenticated(),
  requestValidationMiddleware(deleteExpenseSchema),
  asyncHandler(ExpensesController.deleteExpense)
);

export default router;
