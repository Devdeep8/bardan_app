// src/services/mandi/booking.handler.js
// Mandi Trip: bookings. Creation/cancellation move booked_bori with a
// conditional UPDATE inside one transaction — two farmers racing for the
// last bori cannot both win (the loser's UPDATE touches 0 rows).
import { QueryTypes } from 'sequelize';
import db from '@src/db/models/index.js';
import { AppError } from '@src/errors/app.error.js';
import { BaseHandler } from '@src/libs/base.handler.js';
import { scheduleNotification } from '@src/services/mandi/tripJobs.service.js';

const { Trip, Booking, TripStop, MandiUser, Sequelize } = db;

const BOOKING_INCLUDE = [
  { association: 'farmer', attributes: ['id', 'name', 'phone'] },
  { association: 'stop', include: [{ association: 'village' }] }
];

export class CreateBookingHandler extends BaseHandler {
  async run() {
    const farmerId = this.context.userId;
    const { tripId, boriCount, crop } = this.args;
    const t = this.dbTransaction;

    const trip = await Trip.findByPk(tripId, { transaction: t });
    if (!trip) throw AppError.notFound('Trip not found');
    if (trip.status !== 'scheduled') throw AppError.conflict('यह ट्रिप बुक के लिए उपलब्ध नहीं है');
    if (new Date() > new Date(trip.bookingCutoffAt)) throw AppError.conflict('बुकिंग का समय समाप्त हो गया');
    if (boriCount > trip.capacityBori) {
      throw AppError.badRequest('बहुत ज़्यादा बोरी', { field: 'boriCount', message: `अधिकतम ${trip.capacityBori} बोरी` });
    }

    // stop must belong to the trip; resolve from the farmer's requested village stop
    const stop = await TripStop.findOne({ where: { tripId, villageId: this.args.villageId }, transaction: t });
    if (!stop) throw AppError.badRequest('This trip does not stop at your village', { field: 'villageId' });

    const existing = await Booking.findOne({ where: { tripId, farmerId, status: 'confirmed' }, transaction: t });
    if (existing) throw AppError.conflict('आपकी बुकिंग पहले से है — इसे बदलें (edit) करें');

    // Lock the trip row, then move booked_bori only if it still fits.
    const [, updated] = await db.sequelize.query(
      `UPDATE trips SET booked_bori = booked_bori + $bori
       WHERE id = $tripId AND booked_bori + $bori <= capacity_bori`,
      { bind: { tripId, bori: boriCount }, type: QueryTypes.UPDATE, transaction: t }
    );
    if (updated === 0) {
      const fresh = await Trip.findByPk(tripId, { transaction: t });
      throw AppError.conflict('जगह खत्म हो गई', { boriLeft: Math.max(0, fresh.capacityBori - fresh.bookedBori) });
    }

    const booking = await Booking.create(
      { tripId, farmerId, stopId: stop.id, boriCount, crop },
      { transaction: t }
    );

    return {
      booking: await Booking.findByPk(booking.id, { include: BOOKING_INCLUDE, transaction: t }),
      trip: await Trip.findByPk(tripId, { transaction: t, attributes: ['id', 'capacityBori', 'bookedBori'] })
    };
  }
}

export class UpdateBookingHandler extends BaseHandler {
  async run() {
    const t = this.dbTransaction;
    const booking = await Booking.findByPk(this.args.id, { transaction: t });
    if (!booking) throw AppError.notFound('Booking not found');
    if (booking.farmerId !== this.context.userId) throw AppError.forbidden('Not your booking');
    if (booking.status !== 'confirmed') throw AppError.conflict('बुकिंग बदली नहीं जा सकती');

    const trip = await Trip.findByPk(booking.tripId, { transaction: t });
    if (trip.status !== 'scheduled' || new Date() > new Date(trip.bookingCutoffAt)) {
      throw AppError.conflict('बुकिंग बदलने का समय समाप्त हो गया');
    }

    const delta = this.args.boriCount - booking.boriCount;
    if (delta > 0) {
      const [, updated] = await db.sequelize.query(
        `UPDATE trips SET booked_bori = booked_bori + $delta
         WHERE id = $tripId AND booked_bori + $delta <= capacity_bori`,
        { bind: { tripId: trip.id, delta }, type: QueryTypes.UPDATE, transaction: t }
      );
      if (updated === 0) throw AppError.conflict('जगह खत्प — इतनी बोरी नहीं बढ़ा सकते');
    } else if (delta < 0) {
      await db.sequelize.query(
        `UPDATE trips SET booked_bori = GREATEST(booked_bori + $delta, 0) WHERE id = $tripId`,
        { bind: { tripId: trip.id, delta }, type: QueryTypes.UPDATE, transaction: t }
      );
    }
    await booking.update({ boriCount: this.args.boriCount }, { transaction: t });
    return { booking: await Booking.findByPk(booking.id, { include: BOOKING_INCLUDE, transaction: t }) };
  }
}

export class CancelBookingHandler extends BaseHandler {
  async run() {
    const t = this.dbTransaction;
    const booking = await Booking.findByPk(this.args.id, { transaction: t });
    if (!booking) throw AppError.notFound('Booking not found');
    if (booking.farmerId !== this.context.userId) throw AppError.forbidden('Not your booking');
    if (booking.status !== 'confirmed') throw AppError.conflict('बुकिंग पहले ही रद्द है');

    const trip = await Trip.findByPk(booking.tripId, { transaction: t });
    // free cancellation until the cutoff
    if (trip.status !== 'scheduled' || new Date() > new Date(trip.bookingCutoffAt)) {
      throw AppError.conflict('मुफ्त रद्दीकरण की समयसीमा निकल गई — ड्राइवर से बात करें');
    }

    await booking.update({ status: 'cancelled' }, { transaction: t });
    await db.sequelize.query(
      `UPDATE trips SET booked_bori = GREATEST(booked_bori - $bori, 0) WHERE id = $tripId`,
      { bind: { bori: booking.boriCount, tripId: trip.id }, type: QueryTypes.UPDATE, transaction: t }
    );
    return { booking };
  }
}

export class ListMyBookingsHandler extends BaseHandler {
  async run() {
    const bookings = await Booking.findAll({
      where: { farmerId: this.context.userId, status: ['confirmed', 'completed'] },
      include: [...BOOKING_INCLUDE, { association: 'trip', include: [{ association: 'mandi' }, { association: 'driver', attributes: ['id', 'name', 'phone'] }] }],
      order: [['created_at', 'DESC']]
    });
    return { bookings };
  }
}

export class ListTripBookingsHandler extends BaseHandler {
  async run() {
    const trip = await Trip.findByPk(this.args.tripId);
    if (!trip) throw AppError.notFound('Trip not found');
    if (trip.driverId !== this.context.userId) throw AppError.forbidden('Not your trip');

    const bookings = await Booking.findAll({
      where: { tripId: trip.id, status: 'confirmed' },
      include: BOOKING_INCLUDE,
      order: [['created_at', 'ASC']]
    });
    return {
      bookings,
      totals: {
        bookedBori: trip.bookedBori,
        capacityBori: trip.capacityBori,
        boriLeft: trip.capacityBori - trip.bookedBori,
        farmers: bookings.length
      }
    };
  }
}

export class MarkBookingPaymentHandler extends BaseHandler {
  async run() {
    const booking = await Booking.findByPk(this.args.id);
    if (!booking) throw AppError.notFound('Booking not found');
    const trip = await Trip.findByPk(booking.tripId);
    if (!trip || trip.driverId !== this.context.userId) throw AppError.forbidden('Not your trip');

    await booking.update({ paymentStatus: this.args.paymentStatus });
    return { booking };
  }
}
