// src/services/mandi/auth.handler.js
// Mandi Trip auth: OTP request/verify (long-lived session), profile.
import jwt from 'jsonwebtoken';
import config from '@configs/app.config.js';
import db from '@src/db/models/index.js';
import { AppError } from '@src/errors/app.error.js';
import { BaseHandler } from '@src/libs/base.handler.js';
import { OtpService } from '@src/services/mandi/otp.service.js';

const { MandiUser } = db;

// ~90 days: farmers should almost never see OTP again
const MANDI_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;

const signToken = (user) => jwt.sign(
  { sub: user.id, type: 'access', scope: 'mandi' },
  config.get('jwt.loginTokenSecret'),
  { expiresIn: MANDI_TOKEN_TTL_SECONDS }
);

const normalizePhone = (raw) => {
  const digits = String(raw).replace(/[^0-9]/g, '');
  const local = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  if (!/^[6-9][0-9]{9}$/.test(local)) {
    throw AppError.badRequest('Invalid phone number', { field: 'phone', message: '10 अंकों का मोबाइल नंबर डालें' });
  }
  return local;
};

export class RequestOtpHandler extends BaseHandler {
  async run() {
    const phone = normalizePhone(this.args.phone);
    try {
      const result = await OtpService.request(phone);
      return result;
    } catch (error) {
      if (error.code === 'RESEND_COOLDOWN') {
        throw AppError.rateLimit(`Please wait ${error.message.split(':')[1]}s before requesting a new code`);
      }
      throw error;
    }
  }
}

export class VerifyOtpHandler extends BaseHandler {
  async run() {
    const phone = normalizePhone(this.args.phone);
    const ok = await OtpService.verify(phone, this.args.otp);
    if (!ok) throw AppError.unauthorized('गलत या समाप्त OTP');

    let [user] = await MandiUser.findOrCreate({ where: { phone } });
    // ip/country come from the client's own /cdn-cgi/trace call (Cloudflare)
    const meta = {};
    if (this.args.ip) meta.lastIp = this.args.ip;
    if (this.args.country) meta.country = String(this.args.country).slice(0, 2).toUpperCase();
    await user.update({ lastLoginAt: new Date(), ...meta });

    return { token: signToken(user), expiresIn: MANDI_TOKEN_TTL_SECONDS, user };
  }
}

export class FirebaseLoginHandler extends BaseHandler {
  /**
   * Exchange a Firebase ID token (from client-side Phone Auth) for our
   * long-lived session cookie. Firebase has already verified the SMS OTP —
   * we only verify its ID token and trust the phone_number claim.
   */
  async run() {
    const { getFirebaseAuth, firebaseEnabled } = await import('@src/services/mandi/firebase.service.js');
    if (!firebaseEnabled()) {
      throw AppError.badRequest('Firebase login is not configured on this server (FIREBASE_SERVICE_ACCOUNT missing)');
    }
    const decoded = await (await getFirebaseAuth()).verifyIdToken(this.args.idToken, true);
    if (!decoded.phone_number) throw AppError.unauthorized('Firebase token has no phone number');

    const phone = normalizePhone(decoded.phone_number);
    let [user] = await MandiUser.findOrCreate({ where: { phone } });
    // ip/country come from the client's own /cdn-cgi/trace call (Cloudflare)
    const meta = {};
    if (this.args.ip) meta.lastIp = this.args.ip;
    if (this.args.country) meta.country = String(this.args.country).slice(0, 2).toUpperCase();
    await user.update({ lastLoginAt: new Date(), ...meta });

    return { token: signToken(user), expiresIn: MANDI_TOKEN_TTL_SECONDS, user };
  }
}

export class GetMeHandler extends BaseHandler {
  async run() {
    const user = await MandiUser.findByPk(this.context.userId, { include: [{ association: 'village' }] });
    if (!user) throw AppError.notFound('User not found');
    return { user };
  }
}

export class UpdateMeHandler extends BaseHandler {
  async run() {
    const user = await MandiUser.findByPk(this.context.userId, {
      transaction: this.dbTransaction
    });
    if (!user) throw AppError.notFound('User not found');
    const patch = {};
    if (this.args.name !== undefined) patch.name = this.args.name;
    if (this.args.role !== undefined) {
      if (!['farmer', 'driver'].includes(this.args.role)) {
        throw AppError.badRequest('Invalid role', { field: 'role' });
      }
      patch.role = this.args.role;
    }
    if (this.args.villageId !== undefined) {
      if (this.args.villageId) {
        const village = await db.Village.findByPk(this.args.villageId, {
          transaction: this.dbTransaction
        });
        if (!village) throw AppError.badRequest('Unknown village', { field: 'villageId' });
      }
      patch.villageId = this.args.villageId || null;
    }
    // Keep accepting legacy bilingual fields while onboarding uses one name.
    if (
      this.args.villageName !== undefined ||
      this.args.villageNameHi !== undefined ||
      this.args.villageNameEn !== undefined
    ) {
      const { FindOrCreateVillageHandler } = await import('@src/services/mandi/mandi.handler.js');
      const { village } = await this.callHandler(FindOrCreateVillageHandler, {
        villageName: this.args.villageName,
        villageNameHi: this.args.villageNameHi,
        villageNameEn: this.args.villageNameEn
      });
      patch.villageId = village.id;
    }
    await user.update(patch, { transaction: this.dbTransaction });
    return { user };
  }
}
