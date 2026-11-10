// src/services/mandi/trip.handler.js
// Mandi Trip: trip lifecycle — create, feed, detail, start, end, cancel, repeat.
import db from '@src/db/models/index.js';
import { AppError } from '@src/errors/app.error.js';
import { BaseHandler } from '@src/libs/base.handler.js';
import { scheduleTripJobs, removeTripJobs, scheduleActiveTripJobs, scheduleNotification } from '@src/services/mandi/tripJobs.service.js';

const { Trip, TripStop, Booking, Vehicle, Mandi, Village, MandiUser, Sequelize } = db;
const { Op } = Sequelize;

const TRIP_INCLUDE = [
  { association: 'driver', attributes: ['id', 'name', 'phone'] },
  { association: 'vehicle' },
  { association: 'mandi' },
  { association: 'stops', include: [{ association: 'village' }] }
];

const endOfDay = (d) => {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
};

export class CreateTripHandler extends BaseHandler {
  async run() {
    const driverId = this.context.userId;
    const transaction = this.dbTransaction;

    // Serialize creates per driver so a retried request cannot create a
    // duplicate trip while the first request is still in progress.
    if (transaction) {
      await db.sequelize.query(
        'SELECT pg_advisory_xact_lock(hashtext(:driverId))',
        { replacements: { driverId }, transaction }
      );
    }

    const vehicle = await Vehicle.findOne({
      where: { id: this.args.vehicleId, driverId },
      transaction
    });
    if (!vehicle) throw AppError.badRequest('Vehicle not found for this driver', { field: 'vehicleId' });

    const mandi = await Mandi.findByPk(this.args.mandiId, { transaction });
    if (!mandi) throw AppError.badRequest('Unknown mandi', { field: 'mandiId' });

    const villages = await Village.findAll({
      where: { id: this.args.villageIds },
      transaction
    });
    if (villages.length !== new Set(this.args.villageIds).size) {
      throw AppError.badRequest('Unknown village in list', { field: 'villageIds' });
    }

    const departsAt = new Date(this.args.departsAt);
    if (Number.isNaN(departsAt.getTime())) {
      throw AppError.badRequest('Invalid departure time', { field: 'departsAt' });
    }

    const existingTrip = await Trip.findOne({
      where: {
        driverId,
        vehicleId: vehicle.id,
        mandiId: mandi.id,
        departsAt,
        status: 'scheduled'
      },
      include: TRIP_INCLUDE,
      transaction
    });
    if (existingTrip) {
      const existingVillageIds = existingTrip.stops
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((stop) => stop.villageId);
      const sameRequest =
        existingTrip.capacityBori === this.args.capacityBori &&
        existingTrip.ratePerBori === this.args.ratePerBori &&
        existingVillageIds.length === this.args.villageIds.length &&
        existingVillageIds.every((id, index) => id === this.args.villageIds[index]) &&
        (
          this.args.bookingCutoffAt === undefined ||
          new Date(existingTrip.bookingCutoffAt).getTime() === new Date(this.args.bookingCutoffAt).getTime()
        );
      if (!sameRequest) {
        throw AppError.conflict('इस समय की ट्रिप पहले से बनी है');
      }
      await scheduleTripJobs(existingTrip);
      return { trip: existingTrip };
    }

    const trip = await Trip.create({
      driverId,
      vehicleId: vehicle.id,
      mandiId: mandi.id,
      departsAt,
      // default cutoff: 2 hours before departure, never in the past
      bookingCutoffAt: this.args.bookingCutoffAt
        ? new Date(this.args.bookingCutoffAt)
        : new Date(Math.min(departsAt.getTime() - 2 * 60 * 60 * 1000, Date.now() + 60 * 1000)),
      capacityBori: this.args.capacityBori,
      ratePerBori: this.args.ratePerBori
    }, { transaction });

    await TripStop.bulkCreate(
      this.args.villageIds.map((villageId, orderIndex) => ({ tripId: trip.id, villageId, orderIndex })),
      { transaction }
    );

    await scheduleTripJobs(trip);
    const createdTrip = await Trip.findByPk(trip.id, { include: TRIP_INCLUDE, transaction });
    if (!createdTrip) throw AppError.internal('ट्रिप बन गई, लेकिन ट्रिप की जानकारी लोड नहीं हुई');
    return { trip: createdTrip };
  }
}

export class ListTripsHandler extends BaseHandler {
  /** Farmer feed: upcoming scheduled trips through the caller's village. */
  async run() {
    const where = { status: 'scheduled', departsAt: { [Op.gte]: new Date() } };
    if (this.args.villageId) where['$stops.village_id$'] = this.args.villageId;
    if (this.args.date) {
      const dayStart = new Date(this.args.date); dayStart.setHours(0, 0, 0, 0);
      where.departsAt = { [Op.gte]: dayStart, [Op.lte]: endOfDay(this.args.date) };
    }
    const trips = await Trip.findAll({
      where,
      include: TRIP_INCLUDE,
      order: [['departs_at', 'ASC']],
      limit: 50,
      distinct: true
    });
    return { trips };
  }
}

export class GetTripHandler extends BaseHandler {
  async run() {
    const trip = await Trip.findByPk(this.args.id, { include: TRIP_INCLUDE });
    if (!trip) throw AppError.notFound('Trip not found');
    // caller's own booking, if any (safe for both roles)
    const myBooking = await Booking.findOne({
      where: { tripId: trip.id, farmerId: this.context.userId, status: 'confirmed' }
    });
    return { trip, myBooking: myBooking || null };
  }
}

export class ListMyTripsHandler extends BaseHandler {
  /** Driver: own trips (any status), newest first. */
  async run() {
    const trips = await Trip.findAll({
      where: { driverId: this.context.userId },
      include: TRIP_INCLUDE,
      order: [['departs_at', 'DESC']],
      limit: 50
    });
    return { trips };
  }
}

export class RepeatLastTripHandler extends BaseHandler {
  async run() {
    const last = await Trip.findOne({
      where: { driverId: this.context.userId },
      order: [['created_at', 'DESC']]
    });
    if (!last) throw AppError.notFound('No previous trip to repeat');

    const stops = await TripStop.findAll({ where: { tripId: last.id }, order: [['order_index', 'ASC']] });
    const departsAt = this.args.departsAt ? new Date(this.args.departsAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const clone = await Trip.create({
      driverId: last.driverId,
      vehicleId: last.vehicleId,
      mandiId: last.mandiId,
      departsAt,
      bookingCutoffAt: new Date(Math.min(departsAt.getTime() - 2 * 60 * 60 * 1000, Date.now() + 60 * 1000)),
      capacityBori: last.capacityBori,
      ratePerBori: last.ratePerBori
    }, { transaction: this.dbTransaction });

    await TripStop.bulkCreate(
      stops.map((s, i) => ({ tripId: clone.id, villageId: s.villageId, orderIndex: i })),
      { transaction: this.dbTransaction }
    );

    await scheduleTripJobs(clone);
    return { trip: await Trip.findByPk(clone.id, { include: TRIP_INCLUDE }) };
  }
}

export class UpdateTripHandler extends BaseHandler {
  async run() {
    const trip = await Trip.findByPk(this.args.id);
    if (!trip) throw AppError.notFound('Trip not found');
    if (trip.driverId !== this.context.userId) throw AppError.forbidden('Not your trip');
    if (trip.status !== 'scheduled') throw AppError.conflict('Only scheduled trips can be edited');

    const patch = {};
    for (const field of ['departsAt', 'bookingCutoffAt', 'capacityBori', 'ratePerBori']) {
      if (this.args[field] !== undefined) patch[field] = this.args[field];
    }
    if (patch.capacityBori !== undefined && patch.capacityBori < trip.bookedBori) {
      throw AppError.conflict('Capacity below already-booked bori');
    }
    await trip.update(patch, { transaction: this.dbTransaction });

    if (patch.departsAt || patch.bookingCutoffAt) {
      // reschedule: drop old delayed jobs, add new ones for the new times
      await removeTripJobs(trip.id);
      await scheduleTripJobs(await Trip.findByPk(trip.id));
    }
    return { trip: await Trip.findByPk(trip.id, { include: TRIP_INCLUDE }) };
  }
}

export class CancelTripHandler extends BaseHandler {
  async run() {
    const trip = await Trip.findByPk(this.args.id, {
      include: [{ association: 'bookings', where: { status: 'confirmed' }, required: false, include: [{ association: 'farmer', attributes: ['phone'] }] }]
    });
    if (!trip) throw AppError.notFound('Trip not found');
    if (trip.driverId !== this.context.userId) throw AppError.forbidden('Not your trip');
    if (!['scheduled', 'active'].includes(trip.status)) throw AppError.conflict('Trip cannot be cancelled now');

    await trip.update({ status: 'cancelled' }, { transaction: this.dbTransaction });
    await removeTripJobs(trip.id);
    for (const b of trip.bookings || []) {
      await scheduleNotification(b.farmer.phone, 'ट्रिप रद्द कर दी गई है। कृपया दूसरी ट्रिप बुक करें।');
    }
    return { trip };
  }
}

export class StartTripHandler extends BaseHandler {
  async run() {
    const trip = await Trip.findByPk(this.args.id);
    if (!trip) throw AppError.notFound('Trip not found');
    if (trip.driverId !== this.context.userId) throw AppError.forbidden('Not your trip');
    if (trip.status !== 'scheduled') throw AppError.conflict('Trip is not scheduled');

    await trip.update({ status: 'active', startedAt: new Date() }, { transaction: this.dbTransaction });
    await scheduleActiveTripJobs(trip.id);
    return { trip };
  }
}

export class EndTripHandler extends BaseHandler {
  async run() {
    const trip = await Trip.findByPk(this.args.id);
    if (!trip) throw AppError.notFound('Trip not found');
    if (trip.driverId !== this.context.userId) throw AppError.forbidden('Not your trip');
    if (trip.status !== 'active') throw AppError.conflict('Trip is not active');

    await trip.update({ status: 'completed', endedAt: new Date() }, { transaction: this.dbTransaction });
    await Booking.update({ status: 'completed' }, { where: { tripId: trip.id, status: 'confirmed' }, transaction: this.dbTransaction });
    await removeTripJobs(trip.id);
    return { trip };
  }
}
