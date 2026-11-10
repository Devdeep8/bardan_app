// src/events/event.types.js
// Single source of truth for domain event names. Business code emits these
// via the event bus; queues/consumers subscribe through event.registry.js.
//
// To add a new event: add a constant here, emit it from a handler/service,
// and map it to a queue in event.registry.js.

export const EVENTS = {
  // Auth lifecycle
  AUTH_LOGIN_SUCCEEDED: 'auth.login.succeeded', // payload: { actorId, actorType, actorEmail }
  AUTH_LOGIN_FAILED: 'auth.login.failed', // payload: { actorId: null, actorEmail }
  AUTH_LOGOUT: 'auth.logout', // payload: { actorId, actorType, actorEmail }

  // Generic entity lifecycle — payload: { entity, entityId, actorId, actorType, actorEmail, before?, after? }
  ENTITY_CREATED: 'entity.created',
  ENTITY_UPDATED: 'entity.updated',
  ENTITY_DELETED: 'entity.deleted'
};
