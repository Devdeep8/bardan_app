// src/json-schemas/auditLogs/auditLog.schema.js
const ACTIONS = ['login', 'login_failed', 'logout', 'create', 'update', 'delete'];

export const getAuditLogsSchema = {
  querySchema: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      action: { type: 'string', enum: ACTIONS },
      entity: { type: 'string', maxLength: 100 },
      entityId: { type: 'string', maxLength: 100 },
      actorId: { type: 'string', format: 'uuid' },
      actorEmail: { type: 'string', maxLength: 200 },
      traceId: { type: 'string', maxLength: 100 },
      fromDate: { type: 'string', format: 'date' },
      toDate: { type: 'string', format: 'date' }
    }
  }
};
