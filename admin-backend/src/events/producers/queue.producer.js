// src/events/producers/queue.producer.js
// The ONLY BullMQ-aware code on the producer side. It listens on the event
// bus and enqueues every event that is mapped to a queue in
// event.registry.js. Redaction of sensitive values and before/after diffing
// happen here, centrally, so hook sites stay one-liners.
import { Queue } from 'bullmq';
import config from '@configs/app.config.js';
import { Logger } from '@src/utils/logger.js';
import { EVENT_QUEUE_REGISTRY } from '@src/events/event.registry.js';
import bus from '@src/events/event.bus.js';

const SOURCE = 'admin-backend';

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization', 'cookie'];

const isSensitive = (key) => SENSITIVE_KEYS.some((field) => String(key).toLowerCase().includes(field));

// Deep clone with sensitive keys replaced by '***' (never persists secrets in audit rows)
const redact = (value, seen = new WeakSet()) => {
  if (!value || typeof value !== 'object' || seen.has(value)) return value ?? null;
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => redact(item, seen));

  const result = {};
  for (const [key, val] of Object.entries(value)) {
    result[key] = isSensitive(key)
      ? '***'
      : (val && typeof val === 'object' ? redact(val, seen) : val ?? null);
  }
  return result;
};

// Per-field { before, after } for every key that changed between two snapshots
const diff = (before, after) => {
  const changed = {};
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const key of keys) {
    if (JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])) {
      changed[key] = { before: before?.[key] ?? null, after: after?.[key] ?? null };
    }
  }
  return changed;
};

const connection = () => ({
  host: config.get('redis.host'),
  port: Number(config.get('redis.port')),
  password: config.get('redis.password') || undefined,
  maxRetriesPerRequest: null
});

// Lazy per-queue Queue singletons (shared across all events routed to the queue)
const queues = new Map();
const getQueue = (queueName) => {
  if (!queues.has(queueName)) {
    queues.set(queueName, new Queue(queueName, { connection: connection() }));
  }
  return queues.get(queueName);
};

/**
 * Subscribe the producer to every event in the registry. Called once at
 * bootstrap from src/events/index.js.
 */
export const registerEventProducers = () => {
  for (const [eventName, route] of Object.entries(EVENT_QUEUE_REGISTRY)) {
    bus.on(eventName, async (payload = {}, context = {}) => {
      const logger = context?.logger || Logger;
      try {
        if (!config.get('audit.enabled')) return;

        const before = payload.before ? redact(payload.before) : null;
        const after = payload.after ? redact(payload.after) : null;

        await getQueue(route.queue).add(eventName, {
          eventName,
          payload: {
            ...payload,
            before,
            after,
            changedFields: before && after ? diff(before, after) : null
          },
          meta: {
            traceId: context?.traceId ?? null,
            ip: context?.ip ?? null,
            userAgent: context?.req?.headers?.['user-agent'] ?? null,
            source: SOURCE
          }
        }, {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 500,
          removeOnFail: 5000
        });

        logger.info('Event added to queue', {
          eventName,
          queue: route.queue,
          entityId: payload?.entityId ?? null
        });
      } catch (error) {
        // Auditing must NEVER break the request — log and move on
        logger.warn('Failed to enqueue event', { eventName, error: error.message });
      }
    });
  }

  Logger.info('Event producers registered', {
    events: Object.keys(EVENT_QUEUE_REGISTRY).length
  });
};
