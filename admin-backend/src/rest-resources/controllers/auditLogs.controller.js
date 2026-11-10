// AuditLogsController: audit log endpoints, delegates business logic to handlers
import { sendResponse } from '@src/helpers/response.helpers.js';
import { GetAuditLogsHandler } from '@src/services/auditLogs/auditLog.handler.js';

class AuditLogsController {
  /**
   * GET /api/v1/audit-logs
   * List audit logs (filterable, paginated, newest first).
   */
  static async getAuditLogs(req, res, next) {
    const result = await GetAuditLogsHandler.execute({ ...req.query }, req.context);
    sendResponse({ req, res, next }, result, 'Audit logs retrieved successfully');
  }
}

export default AuditLogsController;
