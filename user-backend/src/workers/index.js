// src/workers/index.js
// Mandi Trip worker process — run with `npm run worker`.
// The API never runs these; a heavy job can never slow a request.
import { Worker } from 'bullmq';
import config from '@configs/app.config.js';
import db from '@src/db/models/index.js';
import { redisClient } from '@src/libs/redis.js';
import { Logger } from '@src/utils/logger.js';
import { MANDI_QUEUE, scheduleActiveTripJobs, scheduleNotification } from '@src/services/mandi/tripJobs.service.js';
import { NotificationService } from '@src/services/mandi/notification.service.js';

const { Trip, Booking, TripStop, MandiUser, MandiStatusReport } = db;

const connection = {
  host: config.get('redis.host'),
  port: config.get('redis.port'),
  password: config.get('redis.password') || undefined,
  maxRetriesPerRequest: null
};

async function tripWithBookings(tripId) {
  const trip = await Trip.findByPk(tripId, {
    include: [
      { association: 'driver', attributes: ['id', 'phone', 'name'] },
      { association: 'bookings', where: { status: 'confirmed' }, required: false, include: [{ association: 'farmer', attributes: ['id', 'phone', 'name'] }] }
    ]
  });
  return trip;
}

async function notifyBookedFarmers(trip, message) {
  await Promise.all((trip.bookings || []).map((b) => scheduleNotification(b.farmer.phone, message)));
}

// Every handler re-reads state from the DB: the job is only a hint.
const handlers = {
  async 'trip.booking-cutoff'({ tripId }) {
    const trip = await tripWithBookings(tripId);
    if (!trip || trip.status !== 'scheduled') return;
    const bori = trip.bookings.reduce((s, b) => s + b.boriCount, 0);
    await scheduleNotification(trip.driver.phone,
      `बुकिंग बंद — ${trip.departsAt.toLocaleTimeString('hi-IN')} की ट्रिप, कुल ${bori} बोरी बुक।`);
  },

  async 'trip.reminder'({ tripId }) {
    const trip = await tripWithBookings(tripId);
    if (!trip || trip.status !== 'scheduled') return;
    await scheduleNotification(trip.driver.phone, `याद रखें: कल यात्रा ${new Date(trip.departsAt).toLocaleTimeString('hi-IN')} पर।`);
    await notifyBookedFarmers(trip, `याद रखें: आपकी ट्रिप ${new Date(trip.departsAt).toLocaleTimeString('hi-IN')} पर निकलेगी।`);
  },

  async 'trip.no-start-check'({ tripId }) {
    const trip = await tripWithBookings(tripId);
    if (!trip || trip.status !== 'scheduled') return;
    await scheduleNotification(trip.driver.phone, 'ट्रिप शुरू करना न भूलें — "Start trip" दबाएँ।');
  },

  async 'trip.expire'({ tripId }) {
    const trip = await tripWithBookings(tripId);
    if (!trip || trip.status !== 'scheduled') return;
    await trip.update({ status: 'expired' });
    await notifyBookedFarmers(trip, 'ट्रिप रद्द हो गई (ड्राइवर ने शुरू नहीं की)। कृपया दूसरी ट्रिप देखें।');
  },

  async 'trip.auto-complete'({ tripId }) {
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.status !== 'active') return;
    await trip.update({ status: 'completed', endedAt: new Date() });
    await Booking.update({ status: 'completed' }, { where: { tripId, status: 'confirmed' } });
    Logger.info(`Auto-completed trip ${tripId}`);
  },

  async 'trip.stale-location-check'({ tripId }) {
    const trip = await Trip.findByPk(tripId);
    if (!trip || trip.status !== 'active') return; // stop the re-queue chain
    const raw = await redisClient.get(`mandi:loc:${tripId}`);
    if (raw) {
      await TripLocationLatestSafeUpdate(tripId, false);
      // still active — check again in 5 minutes
      const { mandiQueue } = await import('@src/services/mandi/tripJobs.service.js');
      await mandiQueue().add('trip.stale-location-check', { tripId }, {
        jobId: `trip.stale-location-check-${tripId}`, delay: 5 * 60 * 1000, attempts: 1,
        removeOnComplete: 500, removeOnFail: 5000
      });
      return;
    }
    const staleMin = 15;
    await TripLocationLatestSafeUpdate(tripId, true);
    const latest = await db.TripLocationLatest.findByPk(tripId);
    const ageMin = latest ? Math.round((Date.now() - new Date(latest.recordedAt).getTime()) / 60000) : Infinity;
    if (ageMin >= 30) {
      const full = await tripWithBookings(tripId);
      await notifyBookedFarmers(full, 'ड्राइवर का लोकेशन सिग्नल बंद हो गया है। ड्राइवर से संपर्क करें।');
    } else {
      const { mandiQueue } = await import('@src/services/mandi/tripJobs.service.js');
      await mandiQueue().add('trip.stale-location-check', { tripId }, {
        jobId: `trip.stale-location-check-${tripId}`, delay: 5 * 60 * 1000, attempts: 1,
        removeOnComplete: 500, removeOnFail: 5000
      });
    }
  },

  async 'mandi.status-expire'() {
    // Display logic reads report age live (see mandi status handler); nothing to write.
  },

  async 'notify.send'({ phone, message }) {
    await NotificationService.notify(phone, message);
  }
};

async function TripLocationLatestSafeUpdate(tripId, signalLost) {
  await db.TripLocationLatest.update({ signalLost }, { where: { tripId } });
}

const worker = new Worker(MANDI_QUEUE, async (job) => {
  const handler = handlers[job.name];
  if (!handler) {
    Logger.warn(`No handler for job ${job.name}`);
    return;
  }
  await handler(job.data);
}, { connection, concurrency: 5 });

worker.on('failed', (job, err) => Logger.error(`Job ${job?.name} failed`, { err: err.message }));
worker.on('completed', (job) => Logger.debug(`Job ${job.name}:${job.id} done`));

Logger.info(`Mandi worker listening on queue "${MANDI_QUEUE}"`);

async function shutdown() {
  await worker.close();
  await db.sequelize.close();
  await redisClient.quit();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGUSR2', shutdown); // nodemon
