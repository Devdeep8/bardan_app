// ExpensesController: daily-expense endpoints, delegates business logic to handlers
import { sendResponse } from '@src/helpers/response.helpers.js';
import {
  CreateExpenseHandler,
  ListExpensesHandler,
  DeleteExpenseHandler
} from '@src/services/expenses/expense.handler.js';
import { todayInBusinessTimeZone } from '@src/helpers/time.helpers.js';

class ExpensesController {
  /** POST /api/v1/expenses — record one expense entry (defaults to today) */
  static async createExpense(req, res, next) {
    const result = await CreateExpenseHandler.execute({ ...req.body }, req.context);
    sendResponse({ req, res, next }, result, 'Expense recorded successfully');
  }

  /** GET /api/v1/expenses?date=YYYY-MM-DD — one day's entries + total */
  static async listExpenses(req, res, next) {
    const result = await ListExpensesHandler.execute(
      { date: req.query.date ?? todayInBusinessTimeZone() },
      req.context
    );
    sendResponse({ req, res, next }, result, 'Expenses retrieved successfully');
  }

  /** DELETE /api/v1/expenses/:id — remove a mistyped entry */
  static async deleteExpense(req, res, next) {
    const result = await DeleteExpenseHandler.execute({ ...req.params }, req.context);
    sendResponse({ req, res, next }, result, 'Expense deleted successfully');
  }
}

export default ExpensesController;
