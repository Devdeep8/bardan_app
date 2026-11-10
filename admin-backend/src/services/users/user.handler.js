// src/services/users/user.handler.js
// Manages USER-BACKEND app users (the shared `users` table) from the admin
// backend. Same pattern as adminUsers: super_admin-only writes (checked in
// run()), business validation in run(), every write emits an audit event.
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import config from '@configs/app.config.js';
import { BaseHandler } from '@src/libs/base.handler.js';
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';
import { emitEvent } from '@src/events/event.bus.js';
import { EVENTS } from '@src/events/event.types.js';

// Audit snapshot of the acting admin (the actor is always an admin here —
// the entity being managed is a user-backend user)
const auditActor = (context) => ({
  actorId: context?.adminId ?? null,
  actorType: context?.admin ? 'admin_user' : null,
  actorEmail: context?.admin?.email ?? null
});

// Only super_admins may manage app users (checked in run() per convention)
const assertCanManageUsers = (context, traceId) => {
  if (context?.admin?.role !== 'super_admin') {
    throw new AppError(Errors.FORBIDDEN, {
      traceId,
      message: 'Only super admins can manage app users'
    });
  }
};

const hashPassword = (password) => bcrypt.hash(
  password,
  config.get('bcrypt.hashingRounds')
);

export class GetUsersHandler extends BaseHandler {
  /**
   * List app users with pagination and name/email search.
   */
  async run() {
    const { User } = this.context.models;
    const { page = 1, limit = 10, q } = this.args;

    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const { rows, count } = await User.findAndCountAll({
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

export class GetUserByIdHandler extends BaseHandler {
  async run() {
    const { User } = this.context.models;
    const user = await User.findByPk(this.args.id, {
      transaction: this.dbTransaction
    });

    if (!user) {
      throw AppError.notFound('User not found', { meta: { resourceId: this.args.id } });
    }

    return user;
  }
}

export class CreateUserHandler extends BaseHandler {
  // Never write the password to logs
  static sanitizeArgs(args = {}) {
    return { name: args.name, email: args.email, isActive: args.isActive, password: '***' };
  }

  async run() {
    const { User } = this.context.models;
    const { name, email, password, isActive = true } = this.args;

    assertCanManageUsers(this.context, this.traceId);

    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({
      where: { email: normalizedEmail },
      transaction: this.dbTransaction
    });
    if (existing) {
      throw AppError.conflict('A user with this email already exists', {
        meta: { email: normalizedEmail }
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: await hashPassword(password),
      isActive
    }, { transaction: this.dbTransaction });

    emitEvent(EVENTS.ENTITY_CREATED, {
      ...auditActor(this.context),
      entity: 'user',
      entityId: user.id,
      after: user.toJSON() // password already stripped by toJSON
    }, this.context);

    return user;
  }
}

export class UpdateUserHandler extends BaseHandler {
  static sanitizeArgs(args = {}) {
    return {
      id: args.id,
      fields: Object.keys(args).filter((key) => key !== 'id' && key !== 'password'),
      password: args.password ? '***' : undefined
    };
  }

  async run() {
    const { User } = this.context.models;
    const { id, name, email, password, isActive } = this.args;

    assertCanManageUsers(this.context, this.traceId);

    const user = await User.findByPk(id, { transaction: this.dbTransaction });
    if (!user) {
      throw AppError.notFound('User not found', { meta: { resourceId: id } });
    }

    const previousUser = user.toJSON();

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (email !== undefined) patch.email = String(email).toLowerCase();
    if (isActive !== undefined) patch.isActive = isActive;
    if (password !== undefined) patch.password = await hashPassword(password);

    await user.update(patch, { transaction: this.dbTransaction });

    emitEvent(EVENTS.ENTITY_UPDATED, {
      ...auditActor(this.context),
      entity: 'user',
      entityId: id,
      before: previousUser,
      after: user.toJSON()
    }, this.context);

    return user;
  }
}

export class DeleteUserHandler extends BaseHandler {
  async run() {
    const { User } = this.context.models;
    const { id } = this.args;

    assertCanManageUsers(this.context, this.traceId);

    const user = await User.findByPk(id, { transaction: this.dbTransaction });
    if (!user) {
      throw AppError.notFound('User not found', { meta: { resourceId: id } });
    }

    await user.destroy({ transaction: this.dbTransaction });

    emitEvent(EVENTS.ENTITY_DELETED, {
      ...auditActor(this.context),
      entity: 'user',
      entityId: id,
      before: user.toJSON()
    }, this.context);

    return { id, deleted: true };
  }
}
