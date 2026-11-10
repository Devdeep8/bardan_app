// src/workers/base.worker.js
// Base class for queue consumers. Subclasses register per-event handlers in
// `handlers` (keyed by event name from src/events/event.types.js); process()
// dispatches via a switch on job.data.eventName and logs every job in/out.
//
// To support a new event on an existing queue: add a case in `getHandler`
// (or a handlers entry) — no changes to the worker bootstrap.
import { Logger } from '@src/utils/logger.js';

export class BaseWorker {
  /**
   * @param {string} name - consumer name used in logs
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Subclasses override to map events to handlers. Shape:
   *   { 'auth.login.succeeded': (data) => {...}, 'entity.created': (data) => {...} }
   */
  get handlers() {
    return {};
  }

  /**
   * Fallback for events with no registered handler. Default: log and skip.
   * @param {object} data - { eventName, payload, meta }
   */
  async onUnhandled(data) {
    Logger.warn('No handler registered for event', {
      worker: this.name,
      eventName: data?.eventName
    });
  }

  /**
   * Resolve the handler for a job. Switch on the event name so adding a new
   * event is an explicit, greppable case.
   */
  getHandler(eventName, payload) {
    switch (eventName) {
      // auth lifecycle
      case 'auth.login.succeeded':
      case 'auth.login.failed':
      case 'auth.logout':
      // entity lifecycle
      case 'entity.created':
      case 'entity.updated':
      case 'entity.deleted':
        return this.handlers[eventName];
      default:
        // Events unknown to this base (future queues) — let subclasses decide
        return this.handlers[eventName] ?? null;
    }
  }

  /**
   * Job processor wired to the BullMQ Worker in src/workers/index.js.
   */
  async process(job) {
    const { eventName, payload, meta } = job.data;

    // "Job arrived" — the full event data (payload is already redacted at the
    // producer; meta is the request context snapshot: traceId, ip, source…)
    Logger.info('Job arrived', {
      worker: this.name,
      jobId: job.id,
      eventName,
      args: payload,
      context: meta,
      attemptsMade: job.attemptsMade
    });

    const handler = this.getHandler(eventName, payload);
    if (!handler) {
      await this.onUnhandled(job.data);
      return;
    }

    const result = await handler({ eventName, payload, meta });

    Logger.info('Job completed successfully', {
      worker: this.name,
      jobId: job.id,
      eventName
    });

    return result;
  }
}
