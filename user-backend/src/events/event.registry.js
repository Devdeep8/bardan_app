// src/events/event.registry.js
// Declarative event -> queue mapping. This is the ONLY place to route a new
// event to a queue, and the only place to introduce a new queue (e.g. a
// future 'notifications' queue for email/WhatsApp dunning consumers).
//
// Example — adding unpaid-user notifications tomorrow:
//   1. new event constant in event.types.js (e.g. PAYMENT_OVERDUE)
//   2. route it here: [EVENTS.PAYMENT_OVERDUE]: { queue: QUEUES.NOTIFICATIONS }
//   3. consumer file + one line in src/workers/registry.js
import config from '@configs/app.config.js';
import { EVENTS } from '@src/events/event.types.js';

export const QUEUES = {
  AUDIT_LOGS: config.get('audit.queueName')
};

export const EVENT_QUEUE_REGISTRY = {
  [EVENTS.AUTH_LOGIN_SUCCEEDED]: { queue: QUEUES.AUDIT_LOGS },
  [EVENTS.AUTH_LOGIN_FAILED]: { queue: QUEUES.AUDIT_LOGS },
  [EVENTS.AUTH_LOGOUT]: { queue: QUEUES.AUDIT_LOGS },
  [EVENTS.ENTITY_CREATED]: { queue: QUEUES.AUDIT_LOGS },
  [EVENTS.ENTITY_UPDATED]: { queue: QUEUES.AUDIT_LOGS },
  [EVENTS.ENTITY_DELETED]: { queue: QUEUES.AUDIT_LOGS }
};
