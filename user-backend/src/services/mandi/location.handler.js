// src/services/mandi/location.handler.js
// Mandi Trip: live location. Hot writes go to Redis (never queued);
// Postgres mirrors the latest row for restarts.
import db from '@src/db/models/index.js';
import { AppError } from '@src/errors/app.error.js';
import { BaseHandler } from '@src/libs/base.handler.js';
import { redisClient } from '@src/libs/redis.js';

const { Trip, Booking, TripLocationLatest, Village } = db;

const redisKey = (tripId) => `mandi:loc:${tripId}`;
const LOC_TTL_SECONDS = 30 * 60;

export class PostLocationHandler extends BaseHandler {
  async run() {
    const trip = await Trip.findByPk(this.args.tripId);
    if (!trip) throw AppError.notFound('Trip not found');
    if (trip.driverId !== this.context.userId) throw AppError.forbidden('Not your trip');
    if (trip.status !== 'active') throw AppError.conflict('Tracking only runs during an active trip');

    const point = {
      lat: this.args.lat,
      lng: this.args.lng,
      accuracy: this.args.accuracy ?? null,
      speed: this.args.speed ?? null,
      recordedAt: this.args.recordedAt ? new Date(this.args.recordedAt) : new Date()
    };

    await redisClient.set(redisKey(trip.id), JSON.stringify(point), 'EX', LOC_TTL_SECONDS);
    await TripLocationLatest.upsert({ tripId: trip.id, ...point, signalLost: false });

    return { stored: true };
  }
}

export class GetLocationHandler extends BaseHandler {
  async run() {
    const trip = await Trip.findByPk(this.args.tripId, { include: [{ association: 'mandi' }, { association: 'stops', include: [{ association: 'village' }] }] });
    if (!trip) throw AppError.notFound('Trip not found');

    const isDriver = trip.driverId === this.context.userId;
    if (!isDriver) {
      // only farmers with a confirmed booking on this trip may see the vehicle
      const booked = await Booking.findOne({
        where: { tripId: trip.id, farmerId: this.context.userId, status: 'confirmed' }
      });
      if (!booked) throw AppError.forbidden('Location is shared only with booked farmers');
    }

    const raw = await redisClient.get(redisKey(trip.id));
    const point = raw ? JSON.parse(raw) : null;

    let nearestStop = null;
    if (point) {
      let best = Infinity;
      for (const stop of trip.stops || []) {
        const d = haversineKm(point.lat, point.lng, stop.village.lat, stop.village.lng);
        if (d < best) { best = d; nearestStop = { name: stop.village.nameHi, distanceKm: round1(d) }; }
      }
    }

    let distanceToMandiKm = null;
    if (point) distanceToMandiKm = round1(haversineKm(point.lat, point.lng, trip.mandi.lat, trip.mandi.lng));

    return {
      tripId: trip.id,
      status: trip.status,
      point, // null when the signal expired — never show a stale point as live
      nearestStop,
      distanceToMandiKm,
      mandi: { id: trip.mandi.id, nameHi: trip.mandi.nameHi }
    };
  }
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const round1 = (x) => Math.round(x * 10) / 10;
