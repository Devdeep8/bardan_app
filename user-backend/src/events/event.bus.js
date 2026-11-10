// src/events/event.bus.js
// Process-local event bus. Business code emits domain events here and never
// touches BullMQ directly. Producers (queue.producer.js) listen on the bus
// and forward registered events to their queues.
//
// emit() is fire-and-forget: a missing listener or a failing listener is
// logged and swallowed — emitting an event can never break the request.
import { EventEmitter } from 'events';
import { Logger } from '@src/utils/logger.js';

const bus = new EventEmitter();
bus.setMaxListeners(50); // one listener per registered event per queue

/**
 * Emit a domain event. Safe to call anywhere in the request path.
 * @param {string} eventName - one of EVENTS (src/events/event.types.js)
 * @param {object} payload   - event-specific data (no sensitive values; producer redacts anyway)
 * @param {object} [context] - handler/request context (traceId, ip, logger, req)
 */
export const emitEvent = (eventName, payload = {}, context = {}) => {
  try {
    bus.emit(eventName, payload, context);
  } catch (error) {
    (context?.logger || Logger).warn('Event emission failed', {
      eventName,
      error: error.message
    });
  }
};

export default bus;
