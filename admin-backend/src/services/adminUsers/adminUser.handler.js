// src/services/adminUsers/adminUser.handler.js
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import config from '@configs/app.config.js';
import { BaseHandler } from '@src/libs/base.handler.js';
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';
import { emitEvent } from '@src/events/event.bus.js';
import { EVENTS } from '@src/events/event.types.js';

const ROLES = ['super_admin', 'admin', 'editor'];

// Audit snapshot of the acting admin for entity lifecycle events
const auditActor = (context) => ({
  actorId: context?.adminId ?? null,
  actorType: context?.admin ? 'admin_user' : null,
  actorEmail: context?.admin?.email ?? null
});

// Only super_admins may manage admin users (checked in run() per convention)
const assertCanManageUsers = (context, traceId) => {
  if (context?.admin?.role !== 'super_admin') {
    throw new AppError(Errors.FORBIDDEN, {
      traceId,
      message: 'Only super admins can manage admin users'
    });
  }
};

const hashPassword = (password) => bcrypt.hash(
  password,
  config.get('bcrypt.hashingRounds')
);

export class GetAdminUsersHandler extends BaseHandler {
  /**
   * List admin users with pagination and name/email search.
   */
  async run() {
    const { AdminUser } = this.context.models;
    const { page = 1, limit = 10, q } = this.args;

    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const { rows, count } = await AdminUser.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      items: rows, // password hash stripped by the model's toJSON
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}

export class GetAdminUserByIdHandler extends BaseHandler {
  async run() {
    const { AdminUser } = this.context.models;
    const adminUser = await AdminUser.findByPk(this.args.id, {
      transaction: this.dbTransaction
    });

    if (!adminUser) {
      throw AppError.notFound('Admin user not found', { meta: { resourceId: this.args.id } });
    }

    return adminUser;
  }
}

export class CreateAdminUserHandler extends BaseHandler {
  // Never write the password to logs
  static sanitizeArgs(args = {}) {
    return { name: args.name, email: args.email, role: args.role, password: '***' };
  }

  async run() {
    const { AdminUser } = this.context.models;
    const { name, email, password, role } = this.args;

    assertCanManageUsers(this.context, this.traceId);

    if (!ROLES.includes(role)) {
      throw new AppError(Errors.BAD_REQUEST, {
        traceId: this.traceId,
        message: `role must be one of: ${ROLES.join(', ')}`
      });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await AdminUser.findOne({
      where: { email: normalizedEmail },
      transaction: this.dbTransaction
    });
    if (existing) {
      throw AppError.conflict('An admin user with this email already exists', {
        meta: { email: normalizedEmail }
      });
    }

    const adminUser = await AdminUser.create({
      name,
      email: normalizedEmail,
      password: await hashPassword(password),
      role
    }, { transaction: this.dbTransaction });

    emitEvent(EVENTS.ENTITY_CREATED, {
      ...auditActor(this.context),
      entity: 'admin_user',
      entityId: adminUser.id,
      after: adminUser.toJSON() // password already stripped by toJSON
    }, this.context);

    return adminUser;
  }
}

export class UpdateAdminUserHandler extends BaseHandler {
  static sanitizeArgs(args = {}) {
    return { id: args.id, fields: Object.keys(args).filter((key) => key !== 'id' && key !== 'password'), password: args.password ? '***' : undefined };
  }

  async run() {
    const { AdminUser } = this.context.models;
    const { id, name, email, password, role, isActive } = this.args;

    assertCanManageUsers(this.context, this.traceId);

    if (role !== undefined && !ROLES.includes(role)) {
      throw new AppError(Errors.BAD_REQUEST, {
        traceId: this.traceId,
        message: `role must be one of: ${ROLES.join(', ')}`
      });
    }

    const adminUser = await AdminUser.findByPk(id, { transaction: this.dbTransaction });
    if (!adminUser) {
      throw AppError.notFound('Admin user not found', { meta: { resourceId: id } });
    }

    const previousAdminUser = adminUser.toJSON();

    // Guardrail: never demote/deactivate the last active super_admin
    const losingSuperAdmin = adminUser.role === 'super_admin' &&
      ((role !== undefined && role !== 'super_admin') || isActive === false);
    if (losingSuperAdmin) {
      const activeSuperAdmins = await AdminUser.count({
        where: { role: 'super_admin', isActive: true, id: { [Op.ne]: id } },
        transaction: this.dbTransaction
      });
      if (activeSuperAdmins === 0) {
        throw AppError.conflict('Cannot remove the last active super admin');
      }
    }

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (email !== undefined) patch.email = String(email).toLowerCase();
    if (role !== undefined) patch.role = role;
    if (isActive !== undefined) patch.isActive = isActive;
    if (password !== undefined) patch.password = await hashPassword(password);

    await adminUser.update(patch, { transaction: this.dbTransaction });

    emitEvent(EVENTS.ENTITY_UPDATED, {
      ...auditActor(this.context),
      entity: 'admin_user',
      entityId: id,
      before: previousAdminUser,
      after: adminUser.toJSON()
    }, this.context);

    return adminUser;
  }
}

export class DeleteAdminUserHandler extends BaseHandler {
  async run() {
    const { AdminUser } = this.context.models;
    const { id } = this.args;

    assertCanManageUsers(this.context, this.traceId);

    // Guardrail: a super admin cannot delete themselves
    if (id === this.context?.adminId) {
      throw AppError.conflict('You cannot delete your own account');
    }

    const adminUser = await AdminUser.findByPk(id, { transaction: this.dbTransaction });
    if (!adminUser) {
      throw AppError.notFound('Admin user not found', { meta: { resourceId: id } });
    }

    // Guardrail: never delete the last active super_admin
    if (adminUser.role === 'super_admin') {
      const otherSuperAdmins = await AdminUser.count({
        where: { role: 'super_admin', isActive: true, id: { [Op.ne]: id } },
        transaction: this.dbTransaction
      });
      if (otherSuperAdmins === 0) {
        throw AppError.conflict('Cannot delete the last active super admin');
      }
    }

    await adminUser.destroy({ transaction: this.dbTransaction });

    emitEvent(EVENTS.ENTITY_DELETED, {
      ...auditActor(this.context),
      entity: 'admin_user',
      entityId: id,
      before: adminUser.toJSON()
    }, this.context);

    return { id, deleted: true };
  }
}
