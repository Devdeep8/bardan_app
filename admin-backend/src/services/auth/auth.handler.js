// src/services/auth/auth.handler.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '@configs/app.config.js';
import { BaseHandler } from '@src/libs/base.handler.js';
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';
import { emitEvent } from '@src/events/event.bus.js';
import { EVENTS } from '@src/events/event.types.js';

const signAccessToken = (admin) => jwt.sign(
  { sub: admin.id, email: admin.email, role: admin.role, type: 'access' },
  config.get('jwt.loginTokenSecret'),
  { expiresIn: config.get('jwt.loginTokenExpiry') }
);

const signRefreshToken = (admin) => jwt.sign(
  { sub: admin.id, type: 'refresh' },
  config.get('jwt.refreshTokenSecret'),
  { expiresIn: config.get('jwt.refreshTokenExpiry') }
);

export class AdminLoginHandler extends BaseHandler {
  // Never write credentials to logs
  static sanitizeArgs (args = {}) {
    return { email: args.email, password: '***' };
  }

  /**
   * Authenticate an admin user with email + password and issue JWT tokens.
   */
  async run () {
    const { AdminUser } = this.context.models;
    const { email, password } = this.args;

    const admin = await AdminUser.findOne({
      where: { email: String(email).toLowerCase() }
    });

    // Same error for unknown email and wrong password to prevent user enumeration
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      emitEvent(EVENTS.AUTH_LOGIN_FAILED, { actorId: null, actorType: 'admin_user', actorEmail: email }, this.context);
      throw new AppError(Errors.INVALID_CREDENTIALS, { traceId: this.traceId });
    }

    if (!admin.isActive) {
      emitEvent(EVENTS.AUTH_LOGIN_FAILED, { actorId: admin.id, actorType: 'admin_user', actorEmail: admin.email }, this.context);
      throw new AppError(Errors.FORBIDDEN, {
        traceId: this.traceId,
        message: 'This admin account has been deactivated'
      });
    }

    admin.lastLoginAt = new Date();
    await admin.save({ fields: ['lastLoginAt'] });

    emitEvent(EVENTS.AUTH_LOGIN_SUCCEEDED, { actorId: admin.id, actorType: 'admin_user', actorEmail: admin.email }, this.context);

    return {
      admin: admin.toJSON(), // password hash stripped by the model's toJSON
      accessToken: signAccessToken(admin),
      refreshToken: signRefreshToken(admin)
    };
  }
}

export class RefreshAdminTokenHandler extends BaseHandler {
  // Never log tokens
  static sanitizeArgs (args = {}) {
    return { refreshToken: '***' };
  }

  /**
   * Exchange a valid refresh token for a fresh access + refresh token pair.
   */
  async run () {
    const { AdminUser } = this.context.models;
    const { refreshToken } = this.args;

    let payload;
    try {
      payload = jwt.verify(refreshToken, config.get('jwt.refreshTokenSecret'));
    } catch (error) {
      throw new AppError(Errors.INVALID_TOKEN, { traceId: this.traceId });
    }

    if (payload.type !== 'refresh') {
      throw new AppError(Errors.INVALID_TOKEN, { traceId: this.traceId });
    }

    const admin = await AdminUser.findByPk(payload.sub);
    if (!admin || !admin.isActive) {
      throw new AppError(Errors.UNAUTHORIZED, { traceId: this.traceId });
    }

    return {
      admin: admin.toJSON(),
      accessToken: signAccessToken(admin),
      refreshToken: signRefreshToken(admin)
    };
  }
}

export class GetAdminProfileHandler extends BaseHandler {
  /**
   * Return the authenticated admin attached to the request context by authMiddleware.
   */
  async run () {
    const { admin } = this.context;
    return admin?.toJSON ? admin.toJSON() : admin;
  }
}
