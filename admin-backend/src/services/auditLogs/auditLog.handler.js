// src/services/auditLogs/auditLog.handler.js
import { Op } from 'sequelize';
import { BaseHandler } from '@src/libs/base.handler.js';

export class GetAuditLogsHandler extends BaseHandler {
  /**
   * List audit logs with filters (action, entity, actor, trace id, date
   * range) and pagination, newest first.
   */
  async run() {
    const { AuditLog, AdminUser } = this.context.models;
    const {
      page = 1, limit = 10,
      action, entity, entityId, actorId, actorEmail, traceId,
      fromDate, toDate
    } = this.args;

    const where = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (actorId) where.actorId = actorId;
    if (actorEmail) where.actorEmail = { [Op.iLike]: `%${actorEmail}%` };
    if (traceId) where.traceId = traceId;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt[Op.gte] = new Date(`${fromDate}T00:00:00.000Z`);
      if (toDate) where.createdAt[Op.lte] = new Date(`${toDate}T23:59:59.999Z`);
    }

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      // Logical actor join (no FK) — current name/role alongside the snapshot
      include: [{
        model: AdminUser,
        as: 'actor',
        attributes: ['id', 'name', 'role'],
        required: false
      }]
    });

    return {
      items: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}
