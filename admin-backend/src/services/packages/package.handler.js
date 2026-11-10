// src/services/packages/package.handler.js
import { BaseHandler } from '@src/libs/base.handler.js';
import { AppError } from '@src/errors/app.error.js';
import { emitEvent } from '@src/events/event.bus.js';
import { EVENTS } from '@src/events/event.types.js';

// Audit snapshot of the acting admin for entity lifecycle events
const auditActor = (context) => ({
  actorId: context?.adminId ?? null,
  actorType: context?.admin ? 'admin_user' : null,
  actorEmail: context?.admin?.email ?? null
});

const PACKAGE_ATTRIBUTES_EXCLUDE = ['createdAt', 'updatedAt', 'deletedAt'];

export class GetPackagesHandler extends BaseHandler {
  /**
   * List packages with pagination and optional filters.
   */
  async run() {
    const { Package } = this.context.models;
    const { page = 1, limit = 10, isActive } = this.args;

    const where = {};
    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    const { rows, count } = await Package.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['sortOrder', 'ASC'], ['id', 'ASC']],
      attributes: { exclude: PACKAGE_ATTRIBUTES_EXCLUDE }
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

export class GetPackageByIdHandler extends BaseHandler {
  async run() {
    const { Package } = this.context.models;
    const { id } = this.args;

    const pkg = await Package.findByPk(id, {
      attributes: { exclude: PACKAGE_ATTRIBUTES_EXCLUDE }
    });

    if (!pkg) {
      throw AppError.notFound('Package not found', { meta: { resourceId: id } });
    }

    return pkg;
  }
}

export class CreatePackageHandler extends BaseHandler {
  /**
   * Keep the raw payload out of logs (it can be large).
   */
  static sanitizeArgs(args) {
    return { name: args.name, title: args.title };
  }

  async run() {
    const { Package } = this.context.models;

    const pkg = await Package.create(this.args, { transaction: this.dbTransaction });

    this.logger.info('Package created', {
      category: 'business',
      packageId: pkg.id,
      name: pkg.name
    });

    emitEvent(EVENTS.ENTITY_CREATED, {
      ...auditActor(this.context),
      entity: 'package',
      entityId: pkg.id,
      after: pkg.toJSON()
    }, this.context);

    return pkg;
  }
}

export class UpdatePackageHandler extends BaseHandler {
  static sanitizeArgs(args) {
    return { id: args.id, fields: Object.keys(args).filter(key => key !== 'id') };
  }

  async run() {
    const { Package } = this.context.models;
    const { id, ...updates } = this.args;

    // Snapshot the pre-update state for the audit diff
    const existing = await Package.findByPk(id, { transaction: this.dbTransaction });
    if (!existing) {
      throw AppError.notFound('Package not found', { meta: { resourceId: id } });
    }

    const [updatedCount] = await Package.update(updates, {
      where: { id },
      transaction: this.dbTransaction
    });

    if (updatedCount === 0) {
      throw AppError.notFound('Package not found', { meta: { resourceId: id } });
    }

    const pkg = await Package.findByPk(id, {
      attributes: { exclude: PACKAGE_ATTRIBUTES_EXCLUDE },
      transaction: this.dbTransaction
    });

    this.logger.info('Package updated', {
      category: 'business',
      packageId: id,
      fields: Object.keys(updates)
    });

    emitEvent(EVENTS.ENTITY_UPDATED, {
      ...auditActor(this.context),
      entity: 'package',
      entityId: id,
      before: existing.toJSON(),
      after: pkg.toJSON()
    }, this.context);

    return pkg;
  }
}

export class DeletePackageHandler extends BaseHandler {
  async run() {
    const { Package } = this.context.models;
    const { id } = this.args;

    const pkg = await Package.findByPk(id, { transaction: this.dbTransaction });
    if (!pkg) {
      throw AppError.notFound('Package not found', { meta: { resourceId: id } });
    }

    // Soft delete (paranoid model)
    await pkg.destroy({ transaction: this.dbTransaction });

    this.logger.info('Package soft-deleted', {
      category: 'business',
      packageId: id
    });

    emitEvent(EVENTS.ENTITY_DELETED, {
      ...auditActor(this.context),
      entity: 'package',
      entityId: id,
      before: pkg.toJSON()
    }, this.context);

    return { id, deleted: true };
  }
}
