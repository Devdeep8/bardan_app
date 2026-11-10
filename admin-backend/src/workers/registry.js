// src/workers/registry.js
// Declarative queue -> consumer mapping. src/workers/index.js boots one
// BullMQ Worker per entry, so adding a consumer = one file + one line here.
// Queues must match QUEUES in src/events/event.registry.js.
import { QUEUES } from '@src/events/event.registry.js';
import { auditLogConsumer } from '@src/workers/consumers/audit-log.consumer.js';

export const WORKER_REGISTRY = {
  [QUEUES.AUDIT_LOGS]: auditLogConsumer
  
};
