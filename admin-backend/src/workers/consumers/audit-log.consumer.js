// src/workers/consumers/audit-log.consumer.js
// Consumes events off the audit-logs queue and persists them to the
// audit_logs table. Registered in src/workers/registry.js.
import db from '@src/db/models/index.js';
import { BaseWorker } from '@src/workers/base.worker.js';

// Maps an event job (from events/producers/queue.producer.js) to an
// audit_logs row.
class AuditLogWorker extends BaseWorker {
  constructor() {
    super('audit-log');
  }

  get handlers() {
    return {
      'auth.login.succeeded': ({ payload, meta }) => this.insert('login', { entity: 'auth', ...payload }, meta),
      'auth.login.failed': ({ payload, meta }) => this.insert('login_failed', { entity: 'auth', ...payload }, meta),
      'auth.logout': ({ payload, meta }) => this.insert('logout', { entity: 'auth', ...payload }, meta),
      'entity.created': ({ payload, meta }) => this.insert('create', payload, meta),
      'entity.updated': ({ payload, meta }) => this.insert('update', payload, meta),
      'entity.deleted': ({ payload, meta }) => this.insert('delete', payload, meta)
    };
  }

  async insert(action, payload = {}, meta = {}) {
    return db.AuditLog.create({
      actorId: payload.actorId ?? null,
      actorType: payload.actorType ?? null,
      actorEmail: payload.actorEmail ?? null,
      action,
      entity: payload.entity ?? 'system',
      entityId: payload.entityId != null ? String(payload.entityId) : null,
      changedFields: payload.changedFields ?? null,
      before: payload.before ?? null,
      after: payload.after ?? null,
      ip: meta.ip ?? null,
      traceId: meta.traceId ?? null,
      source: meta.source ?? null,
      userAgent: meta.userAgent ?? null
    });
  }
}

export const auditLogConsumer = new AuditLogWorker();
