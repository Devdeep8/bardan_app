// src/services/expenses/expense.handler.js
import db from '@src/db/models/index.js';
import { BaseHandler } from '@src/libs/base.handler.js';
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';
import { emitEvent } from '@src/events/event.bus.js';
import { EVENTS } from '@src/events/event.types.js';
import { EXPENSE_CATEGORIES } from '@src/db/models/expense.model.js';
import { isValidDateString, todayInBusinessTimeZone } from '@src/helpers/time.helpers.js';

const auditActor = (context) => ({
  actorId: context?.userId ?? null,
  actorType: context?.user ? 'user' : 'system',
  actorEmail: context?.user?.email ?? null
});

const { Expense } = db;

const AMOUNT_MAX = 9999999;
const NOTE_MAX_LENGTH = 500;

// --- expense field rules — owned here, not by the route schema ---
const assertValidCategory = (category, traceId) => {
  if (!EXPENSE_CATEGORIES.includes(category)) {
    throw new AppError(Errors.INVALID_INPUT, {
      traceId,
      field: 'category',
      message: `category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`
    });
  }
};

const assertValidAmount = (amount, traceId) => {
  const parsed = Number(amount);
  if (!(parsed > 0) || parsed > AMOUNT_MAX) {
    throw new AppError(Errors.INVALID_INPUT, {
      traceId,
      field: 'amount',
      message: `amount must be a number greater than 0 and at most ${AMOUNT_MAX}`
    });
  }
  return parsed;
};

const parseOptionalText = (value, field, maxLength, traceId) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    throw new AppError(Errors.INVALID_INPUT, {
      traceId,
      field,
      message: `${field} must be at most ${maxLength} characters`
    });
  }
  return trimmed;
};

export class CreateExpenseHandler extends BaseHandler {
  /**
   * Record one expense entry for a business-local day (defaults to today;
   * back-dating is allowed for yesterday's diesel etc., the future is not).
   * Runs inside the request transaction started by contextMiddleware(true).
   */
  async run () {
    const { category, amount, note, date } = this.args;
    const t = this.dbTransaction;

    assertValidCategory(category, this.traceId);
    const validAmount = assertValidAmount(amount, this.traceId);
    const validNote = parseOptionalText(note, 'note', NOTE_MAX_LENGTH, this.traceId);

    const expenseDate = date ?? todayInBusinessTimeZone();
    if (!isValidDateString(expenseDate)) {
      throw new AppError(Errors.INVALID_INPUT, {
        traceId: this.traceId,
        field: 'date',
        message: 'date must be a valid YYYY-MM-DD'
      });
    }
    if (expenseDate > todayInBusinessTimeZone()) {
      throw new AppError(Errors.INVALID_INPUT, {
        traceId: this.traceId,
        field: 'date',
        message: 'date cannot be in the future'
      });
    }

    const expense = await Expense.create(
      {
        expense_date: expenseDate,
        category,
        amount: validAmount,
        note: validNote,
        created_by: this.context?.userId ?? null
      },
      { transaction: t }
    );

    emitEvent(EVENTS.ENTITY_CREATED, {
      ...auditActor(this.context),
      entity: 'expense',
      entityId: expense.id,
      after: expense.toJSON()
    }, this.context);

    return expense;
  }
}

export class ListExpensesHandler extends BaseHandler {
  /**
   * All expense entries for one business-local day (defaults to today),
   * newest first, plus a day total — the dashboard/expense page shape.
   */
  async run () {
    const { date } = this.args;
    const expenseDate = date ?? todayInBusinessTimeZone();
    if (!isValidDateString(expenseDate) || expenseDate > todayInBusinessTimeZone()) {
      throw new AppError(Errors.INVALID_INPUT, {
        traceId: this.traceId,
        message: 'date must be a valid YYYY-MM-DD and cannot be in the future'
      });
    }

    const expenses = await Expense.findAll({
      where: { expense_date: expenseDate },
      order: [['created_at', 'DESC']]
    });
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    return { date: expenseDate, total, expenses };
  }
}

export class DeleteExpenseHandler extends BaseHandler {
  /**
   * Remove a mistyped entry. Runs inside the request transaction started by
   * contextMiddleware(true).
   */
  async run () {
    const { id } = this.args;
    const t = this.dbTransaction;

    const expense = await Expense.findByPk(id, { transaction: t });
    if (!expense) {
      throw new AppError(Errors.NOT_FOUND, { traceId: this.traceId, message: 'Expense not found' });
    }

    const previous = expense.toJSON();
    await expense.destroy({ transaction: t });

    emitEvent(EVENTS.ENTITY_DELETED, {
      ...auditActor(this.context),
      entity: 'expense',
      entityId: id,
      before: previous
    }, this.context);

    return { id };
  }
}
