// src/rest-resources/routes/api/v1/auditLogs.routes.js
import { Router } from 'express';
import AuditLogsController from '@controllers/auditLogs.controller.js';
import asyncHandler from '@src/utils/async-handler.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import isAdminAuthenticated from '@src/rest-resources/middlewares/isAdminAuthenticated.middleware.js';
import requestValidationMiddleware from '@src/rest-resources/middlewares/requestValidation.middleware.js';
import { getAuditLogsSchema } from '@src/json-schemas/auditLogs/auditLog.schema.js';

const router = Router();

/**
 * @route   GET /api/v1/audit-logs
 * @desc    List audit logs (filter by action, entity, actor, trace id, date range)
 * @access  Private (Admin)
 */
router.get(
  '/',
  contextMiddleware(),
  isAdminAuthenticated(),
  requestValidationMiddleware(getAuditLogsSchema),
  asyncHandler(AuditLogsController.getAuditLogs)
);

export default router;
