// src/services/auth/auth.handler.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '@configs/app.config.js';
import { BaseHandler } from '@src/libs/base.handler.js';
import { AppError } from '@src/errors/app.error.js';
import Errors from '@src/errors/errorCodes.js';
import { emitEvent } from '@src/events/event.bus.js';
import { EVENTS } from '@src/events/event.types.js';

const signAccessToken = (user) => jwt.sign(
  { sub: user.id, email: user.email, type: 'access' },
  config.get('jwt.loginTokenSecret'),
  { expiresIn: config.get('jwt.loginTokenExpiry') }
);

const signRefreshToken = (user) => jwt.sign(
  { sub: user.id, type: 'refresh' },
  config.get('jwt.refreshTokenSecret'),
  { expiresIn: config.get('jwt.refreshTokenExpiry') }
);

export class UserLoginHandler extends BaseHandler {
  // Never write credentials to logs
  static sanitizeArgs (args = {}) {
    return { email: args.email, password: '***' };
  }

  /**
   * Authenticate a user with email + password and issue JWT tokens.
   */
  async run () {
    const { User } = this.context.models;
    const { email, password } = this.args;

    const user = await User.findOne({
      where: { email: String(email).toLowerCase() }
    });

    // Same error for unknown email and wrong password to prevent user enumeration
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      emitEvent(EVENTS.AUTH_LOGIN_FAILED, { actorId: null, actorType: 'user', actorEmail: email }, this.context);
      throw new AppError(Errors.INVALID_CREDENTIALS, { traceId: this.traceId });
    }

    if (!user.isActive) {
      emitEvent(EVENTS.AUTH_LOGIN_FAILED, { actorId: user.id, actorType: 'user', actorEmail: user.email }, this.context);
      throw new AppError(Errors.FORBIDDEN, {
        traceId: this.traceId,
        message: 'This account has been deactivated'
      });
    }

    user.lastLoginAt = new Date();
    await user.save({ fields: ['lastLoginAt'] });

    emitEvent(EVENTS.AUTH_LOGIN_SUCCEEDED, { actorId: user.id, actorType: 'user', actorEmail: user.email }, this.context);

    return {
      user: user.toJSON(), // password hash stripped by the model's toJSON
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken(user)
    };
  }
}

export class RefreshUserTokenHandler extends BaseHandler {
  // Never log tokens
  static sanitizeArgs (args = {}) {
    return { refreshToken: '***' };
  }

  /**
   * Exchange a valid refresh token for a fresh access + refresh token pair.
   */
  async run () {
    const { User } = this.context.models;
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

    const user = await User.findByPk(payload.sub);
    if (!user || !user.isActive) {
      throw new AppError(Errors.UNAUTHORIZED, { traceId: this.traceId });
    }

    return {
      user: user.toJSON(),
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken(user)
    };
  }
}

export class GetUserProfileHandler extends BaseHandler {
  /**
   * Return the authenticated user attached to the request context by authMiddleware.
   */
  async run () {
    const { user } = this.context;
    return user?.toJSON ? user.toJSON() : user;
  }
}
