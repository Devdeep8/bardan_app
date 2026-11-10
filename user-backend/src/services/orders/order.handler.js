// src/services/orders/order.handler.js
import db from '@src/db/models/index.js';
import { BaseHandler } from '@src/libs/base.handler.js';
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';
import { emitEvent } from '@src/events/event.bus.js';
import { EVENTS } from '@src/events/event.types.js';
import {
  isValidDateString,
  todayInBusinessTimeZone
} from '@src/helpers/time.helpers.js';

// Audit snapshot of the acting user (orders are a user-backend write path)
const auditActor = (context) => ({
  actorId: context?.userId ?? null,
  actorType: context?.user ? 'user' : 'system',
  actorEmail: context?.user?.email ?? null
});

const { Order, Customer } = db;

// Human-readable order numbers start here; existing lower numbers are preserved.
const FIRST_ORDER_NO = 1010;
const ORDER_NO_RETRIES = 3; // guards the max+1 sequence against concurrent creates
const PHONE_PATTERN = /^[0-9]{10}$/; // Indian mobile numbers, no country code

// --- bahi-khata field rules — owned here, not by the route schema ---
const MATERIALS = ['ret', 'gitti', 'both'];
const PAYMENT_TYPES = ['nagad', 'udhaar', 'online']; // informational only — never affects derived status
const VILLAGE_MIN_LENGTH = 2;
const VILLAGE_MAX_LENGTH = 100;
const QUANTITY_MIN = 1;
const QUANTITY_MAX = 999;
const RATE_MAX = 9999999;
const GRADE_MAX_LENGTH = 50;
const NOTE_MAX_LENGTH = 500;

const findOrderWithCustomer = (id, transaction) =>
  Order.findByPk(id, {
    include: [{ model: Customer, as: 'customer' }],
    transaction
  });

// Strict 10-digit phone — raised from the service so the rule is owned here,
// not by the route schema.
const assertValidPhone = (phone, traceId) => {
  if (!PHONE_PATTERN.test(phone || '')) {
    throw new AppError(Errors.INVALID_INPUT, {
      traceId,
      field: 'phone',
      message: 'Phone number must be exactly 10 digits'
    });
  }
};

// Required village, trimmed to a sane length
const assertValidVillage = (village, traceId) => {
  const trimmed = String(village ?? '').trim();
  if (trimmed.length < VILLAGE_MIN_LENGTH || trimmed.length > VILLAGE_MAX_LENGTH) {
    throw new AppError(Errors.INVALID_INPUT, {
      traceId,
      field: 'village',
      message: `Village must be ${VILLAGE_MIN_LENGTH}-${VILLAGE_MAX_LENGTH} characters`
    });
  }
  return trimmed;
};

const assertOneOf = (field, value, allowed, traceId) => {
  if (!allowed.includes(value)) {
    throw new AppError(Errors.INVALID_INPUT, {
      traceId,
      field,
      message: `${field} must be one of: ${allowed.join(', ')}`
    });
  }
};

// Whole trolleys only
const assertValidQuantity = (quantity, traceId) => {
  const parsed = Number(quantity);
  if (!Number.isInteger(parsed) || parsed < QUANTITY_MIN || parsed > QUANTITY_MAX) {
    throw new AppError(Errors.INVALID_INPUT, {
      traceId,
      field: 'quantity',
      message: `Quantity must be a whole number between ${QUANTITY_MIN} and ${QUANTITY_MAX}`
    });
  }
  return parsed;
};

// Optional free-text fields: trimmed, or null when empty/absent
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

// Optional ₹ per trolley — null when empty/absent
const parseRate = (rate, traceId) => {
  if (rate === undefined || rate === null || rate === '') return null;
  const parsed = Number(rate);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > RATE_MAX) {
    throw new AppError(Errors.INVALID_INPUT, {
      traceId,
      field: 'rate',
      message: `Rate must be a number between 0 and ${RATE_MAX}`
    });
  }
  return parsed;
};

export class CreateOrderHandler extends BaseHandler {
  /**
   * Create an order for the customer with the given phone, creating the
   * customer on first contact. Runs inside the request transaction started
   * by contextMiddleware(true) — customer find-or-create + order create
   * commit or roll back together.
   *
   * Bahi-khata fields: village/material/quantity/payment_type are required;
   * grade, rate and note are optional. total_amount is optional — when
   * omitted it is computed as quantity × rate; an explicit total overrides
   * (mixed loads etc.). Status is never stored — always derived.
   */
  async run () {
    const {
      phone,
      name,
      total_amount: explicitTotal,
      amount_received: amountReceived = 0
    } = this.args;
    const t = this.dbTransaction;

    // Strict 10-digit phone, enforced in the service
    assertValidPhone(phone, this.traceId);

    // Optional ledger day — defaults to today; past days allowed (back-dating
    // a yesterday order), future days never.
    const orderDate = this.args.date ?? todayInBusinessTimeZone();
    if (!isValidDateString(orderDate)) {
      throw new AppError(Errors.INVALID_INPUT, {
        traceId: this.traceId,
        field: 'date',
        message: 'date must be a valid YYYY-MM-DD'
      });
    }
    if (orderDate > todayInBusinessTimeZone()) {
      throw new AppError(Errors.INVALID_INPUT, {
        traceId: this.traceId,
        field: 'date',
        message: 'date cannot be in the future'
      });
    }

    // Required bahi-khata fields
    const village = assertValidVillage(this.args.village, this.traceId);
    assertOneOf('material', this.args.material, MATERIALS, this.traceId);
    assertOneOf('payment_type', this.args.payment_type, PAYMENT_TYPES, this.traceId);
    const quantity = assertValidQuantity(this.args.quantity, this.traceId);

    // Optional bahi-khata fields
    const rate = parseRate(this.args.rate, this.traceId);
    const grade = parseOptionalText(this.args.grade, 'grade', GRADE_MAX_LENGTH, this.traceId);
    const note = parseOptionalText(this.args.note, 'note', NOTE_MAX_LENGTH, this.traceId);

    // Total: explicit override wins; otherwise quantity × rate
    let totalAmount;
    if (explicitTotal !== undefined && explicitTotal !== null) {
      totalAmount = Number(explicitTotal);
    } else {
      if (rate === null) {
        throw new AppError(Errors.INVALID_INPUT, {
          traceId: this.traceId,
          field: 'total_amount',
          message: 'total_amount is required when rate is missing'
        });
      }
      totalAmount = Number((quantity * rate).toFixed(2));
    }
    if (!(totalAmount > 0)) {
      throw new AppError(Errors.INVALID_INPUT, {
        traceId: this.traceId,
        field: 'total_amount',
        message: 'total_amount must be greater than 0'
      });
    }

    if (Number(amountReceived) > Number(totalAmount)) {
      throw new AppError(Errors.INVALID_INPUT, {
        traceId: this.traceId,
        message: 'amount_received cannot exceed total_amount'
      });
    }

    // Find-or-create the customer by phone (phone is the dedup key).
    // An existing customer's name is IMMUTABLE — a different name submitted
    // with a known phone is silently ignored (the form locks the field).
    let customer = await Customer.findOne({ where: { phone }, transaction: t });
    if (!customer) {
      customer = await Customer.create({ phone, name }, { transaction: t });
    }

    // order_no = last + 1; retry on the (rare) unique-collision from
    // concurrent creates.
    let order;
    for (let attempt = 0; attempt < ORDER_NO_RETRIES; attempt++) {
      const maxNo = await Order.max('order_no', { transaction: t });
      const nextNo = Math.max(maxNo ?? FIRST_ORDER_NO - 1, FIRST_ORDER_NO - 1) + 1;
      try {
        order = await Order.create(
          {
            order_no: nextNo,
            order_date: orderDate,
            customer_id: customer.id,
            total_amount: totalAmount,
            amount_received: amountReceived,
            village,
            material: this.args.material,
            grade,
            quantity,
            rate,
            payment_type: this.args.payment_type,
            note
          },
          { transaction: t }
        );
        break;
      } catch (error) {
        const isUniqueCollision = error?.name === 'SequelizeUniqueConstraintError';
        if (!isUniqueCollision || attempt === ORDER_NO_RETRIES - 1) throw error;
      }
    }

    emitEvent(EVENTS.ENTITY_CREATED, {
      ...auditActor(this.context),
      entity: 'order',
      entityId: order.id,
      after: order.toJSON()
    }, this.context);

    // Reload with the customer joined so the response matches the list shape
    return findOrderWithCustomer(order.id, t);
  }
}

export class ListOrdersHandler extends BaseHandler {
  /**
   * Orders belonging to the given calendar day (YYYY-MM-DD, defaults to
   * today) — matched on order_date, so back-dated orders appear on their
   * ledger day — newest first, with the customer joined for the dashboard.
   */
  async run () {
    const { date } = this.args;
    if (!isValidDateString(date)) {
      throw new AppError(Errors.INVALID_INPUT, {
        traceId: this.traceId,
        message: 'date must be a valid YYYY-MM-DD'
      });
    }
    // Orders cannot exist in the future — block browsing beyond today
    if (date > todayInBusinessTimeZone()) {
      throw new AppError(Errors.INVALID_INPUT, {
        traceId: this.traceId,
        message: 'date cannot be in the future'
      });
    }

    return Order.findAll({
      where: { order_date: date },
      include: [{ model: Customer, as: 'customer' }],
      order: [['order_no', 'DESC']]
    });
  }
}

export class GetOrderHandler extends BaseHandler {
  async run () {
    const order = await findOrderWithCustomer(this.args.id, this.dbTransaction);
    if (!order) {
      throw new AppError(Errors.NOT_FOUND, { traceId: this.traceId, message: 'Order not found' });
    }
    return order;
  }
}

export class UpdateOrderReceivedHandler extends BaseHandler {
  /**
   * Record a payment: update amount_received. Status is never written —
   * it is recomputed from the amounts on every response.
   */
  async run () {
    const { id, amount_received: amountReceived } = this.args;
    const t = this.dbTransaction;

    const order = await findOrderWithCustomer(id, t);
    if (!order) {
      throw new AppError(Errors.NOT_FOUND, { traceId: this.traceId, message: 'Order not found' });
    }

    // Snapshot the pre-update state for the audit diff
    const previousOrder = order.toJSON();

    if (Number(amountReceived) > Number(order.total_amount)) {
      throw new AppError(Errors.INVALID_INPUT, {
        traceId: this.traceId,
        message: 'amount_received cannot exceed total_amount'
      });
    }

    order.amount_received = amountReceived;
    await order.save({ fields: ['amount_received'], transaction: t });

    emitEvent(EVENTS.ENTITY_UPDATED, {
      ...auditActor(this.context),
      entity: 'order',
      entityId: id,
      before: previousOrder,
      after: order.toJSON()
    }, this.context);

    await order.reload({
      include: [{ model: Customer, as: 'customer' }],
      transaction: t
    });
    return order;
  }
}
