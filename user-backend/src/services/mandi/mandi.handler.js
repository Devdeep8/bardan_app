// src/services/mandi/mandi.handler.js
// Mandi Trip: reference data (villages, mandis) and crowd-sourced gate status.
import db from '@src/db/models/index.js';
import { AppError } from '@src/errors/app.error.js';
import { BaseHandler } from '@src/libs/base.handler.js';

const { Village, Mandi, Vehicle, MandiStatusReport, Sequelize } = db;
const { Op } = Sequelize;

export class ListVillagesHandler extends BaseHandler {
  async run() {
    const villages = await Village.findAll({ order: [['name_hi', 'ASC']] });
    return { villages };
  }
}

export class FindOrCreateVillageHandler extends BaseHandler {
  /**
   * Village typed by the user at onboarding.
   * Reuses a seeded village when either stored name matches; otherwise creates
   * it with the supplied name in both display fields.
   */
  async run() {
    const name = (
      this.args.villageName ||
      this.args.villageNameHi ||
      this.args.villageNameEn ||
      ''
    ).trim();
    if (!name) {
      throw AppError.badRequest('गांव का नाम डालें', { field: 'villageName' });
    }
    const slug = (s) => s.toLowerCase().replace(/\s+/g, '');
    const existing = await Village.findAll({ transaction: this.dbTransaction });
    const normalizedName = slug(name);
    const match = existing.find((v) =>
      slug(v.nameEn) === normalizedName ||
      slug(v.nameHi) === normalizedName
    );
    if (match) return { village: match };
    // no coordinates from a typed name — centered on Mandsaur district until edited
    const village = await Village.create({
      nameHi: name,
      nameEn: name,
      lat: 24.0669, lng: 75.0679
    }, { transaction: this.dbTransaction });
    return { village };
  }
}

export class ListMandisHandler extends BaseHandler {
  async run() {
    const mandis = await Mandi.findAll({ order: [['name_hi', 'ASC']] });
    return { mandis };
  }
}

export class CreateVehicleHandler extends BaseHandler {
  async run() {
    const vehicle = await Vehicle.create({ ...this.args, driverId: this.context.userId });
    return { vehicle };
  }
}

export class ListVehiclesHandler extends BaseHandler {
  async run() {
    const vehicles = await Vehicle.findAll({ where: { driverId: this.context.userId } });
    return { vehicles };
  }
}

export class ReportMandiStatusHandler extends BaseHandler {
  async run() {
    const mandi = await Mandi.findByPk(this.args.mandiId);
    if (!mandi) throw AppError.badRequest('Unknown mandi', { field: 'mandiId' });
    // any verified user can report; drivers at the gate are the expected source
    const report = await MandiStatusReport.create({
      mandiId: mandi.id,
      reporterId: this.context.userId,
      status: this.args.status
    });
    return { report };
  }
}

export class GetMandiStatusHandler extends BaseHandler {
  /**
   * Display rule: show a status only if 2+ agreeing reports in the last
   * 30 minutes, else fall back to "no recent update". Age and confirmation
   * count are always returned so the UI can show them.
   */
  async run() {
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const reports = await MandiStatusReport.findAll({
      where: { mandiId: this.args.mandiId, createdAt: { [Op.gte]: since } },
      order: [['created_at', 'DESC']]
    });

    const byStatus = {};
    for (const r of reports) {
      byStatus[r.status] = byStatus[r.status] || [];
      byStatus[r.status].push(r.createdAt);
    }

    let displayed = null;
    let confirmations = 0;
    for (const [status, times] of Object.entries(byStatus)) {
      if (times.length >= 2) { displayed = status; confirmations = times.length; }
    }
    const latest = reports[0];
    if (!displayed && latest && Date.now() - new Date(latest.createdAt).getTime() < 15 * 60 * 1000) {
      displayed = latest.status;
      confirmations = 1;
    }

    return {
      status: displayed, // null → UI shows "हाल ही में कोई अपडेट नहीं"
      confirmations,
      lastReportAt: latest ? latest.createdAt : null
    };
  }
}
