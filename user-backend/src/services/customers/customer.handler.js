// src/services/customers/customer.handler.js
import db from '@src/db/models/index.js';
import { BaseHandler } from '@src/libs/base.handler.js';
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';

const { Customer, Order, Sequelize } = db;

// Aggregate order stats for the given customer ids in one grouped query:
// { orders_count, total_amount, total_received } keyed by customer_id
const orderStatsById = async (customerIds, transaction) => {
  const map = new Map();
  if (customerIds.length === 0) return map;

  const rows = await Order.findAll({
    attributes: [
      'customer_id',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'orders_count'],
      [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_amount'],
      [Sequelize.fn('SUM', Sequelize.col('amount_received')), 'total_received']
    ],
    where: { customer_id: customerIds },
    group: ['customer_id'],
    transaction
  });

  for (const row of rows) {
    map.set(row.customer_id, {
      ordersCount: Number(row.get('orders_count')) || 0,
      totalAmount: Number(row.get('total_amount')) || 0,
      totalReceived: Number(row.get('total_received')) || 0
    });
  }
  return map;
};

const PHONE_PATTERN = /^[0-9]{10}$/; // Indian mobile numbers, no country code

export class LookupCustomerHandler extends BaseHandler {
  /**
   * Phone-typing autofill for the order form: return the known customer's
   * name + preferred_language plus their most recent order's bahi-khata
   * fields (village/material/grade/quantity/rate/payment_type) so repeat
   * customers can be prefilled, or NOT_FOUND for new customers.
   */
  async run () {
    // Strict 10-digit phone, enforced in the service
    if (!PHONE_PATTERN.test(this.args.phone || '')) {
      throw new AppError(Errors.INVALID_INPUT, {
        traceId: this.traceId,
        field: 'phone',
        message: 'Phone number must be exactly 10 digits'
      });
    }

    const customer = await Customer.findOne({
      where: { phone: this.args.phone },
      attributes: ['id', 'name', 'phone', 'preferred_language'],
      transaction: this.dbTransaction
    });

    if (!customer) {
      throw new AppError(Errors.NOT_FOUND, { traceId: this.traceId, message: 'Customer not found' });
    }

    // Latest order by human order number (order_no increases monotonically)
    const lastOrder = await Order.findOne({
      where: { customer_id: customer.id },
      attributes: ['village', 'material', 'grade', 'quantity', 'rate', 'payment_type'],
      order: [['order_no', 'DESC']],
      transaction: this.dbTransaction
    });

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      preferred_language: customer.preferred_language,
      last_order: lastOrder
        ? {
            village: lastOrder.village,
            material: lastOrder.material,
            grade: lastOrder.grade,
            quantity: lastOrder.quantity,
            rate: lastOrder.rate == null ? null : Number(lastOrder.rate),
            payment_type: lastOrder.payment_type
          }
        : null
    };
  }
}

export class ListCustomersHandler extends BaseHandler {
  /**
   * Khata index: paginated customers with per-customer order stats
   * (order count, total billed, total pending). Optional search matches
   * the name (substring) or phone (prefix, digits only).
   */
  async run () {
    const { page = 1, limit = 20, search } = this.args;

    const where = {};
    const term = String(search ?? '').trim();
    if (term) {
      const digits = term.replace(/\D/g, '');
      const conditions = [{ name: { [Sequelize.Op.iLike]: `%${term}%` } }];
      if (digits.length >= 3) {
        conditions.push({ phone: { [Sequelize.Op.iLike]: `${digits.slice(0, 10)}%` } });
      }
      where[Sequelize.Op.or] = conditions;
    }

    const { rows, count } = await Customer.findAndCountAll({
      where,
      attributes: ['id', 'name', 'phone', 'preferred_language'],
      order: [['name', 'ASC'], ['phone', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      transaction: this.dbTransaction
    });

    const stats = await orderStatsById(rows.map((customer) => customer.id), this.dbTransaction);

    const items = rows.map((customer) => {
      const stat = stats.get(customer.id);
      const totalAmount = stat?.totalAmount ?? 0;
      const pending = Math.max(0, totalAmount - (stat?.totalReceived ?? 0));
      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        preferred_language: customer.preferred_language,
        orders_count: stat?.ordersCount ?? 0,
        total_amount: totalAmount,
        total_pending: pending
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}

export class ListCustomerOrdersHandler extends BaseHandler {
  /**
   * One customer's full order history, newest first, paginated — with
   * all-time totals for the header. Items serialize via Order.toJSON.
   */
  async run () {
    const { id, page = 1, limit = 10 } = this.args;

    const customer = await Customer.findByPk(id, {
      attributes: ['id', 'name', 'phone', 'preferred_language'],
      transaction: this.dbTransaction
    });
    if (!customer) {
      throw new AppError(Errors.NOT_FOUND, { traceId: this.traceId, message: 'Customer not found' });
    }

    const { rows, count } = await Order.findAndCountAll({
      where: { customer_id: id },
      limit,
      offset: (page - 1) * limit,
      order: [['order_no', 'DESC']],
      transaction: this.dbTransaction
    });

    const stats = await orderStatsById([id], this.dbTransaction);
    const stat = stats.get(id);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        preferred_language: customer.preferred_language
      },
      totals: {
        orders_count: stat?.ordersCount ?? 0,
        total_amount: stat?.totalAmount ?? 0,
        total_pending: Math.max(0, (stat?.totalAmount ?? 0) - (stat?.totalReceived ?? 0))
      },
      items: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}
