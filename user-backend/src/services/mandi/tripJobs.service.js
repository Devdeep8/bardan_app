// src/services/mandi/tripJobs.service.js
// BullMQ scheduling for everything that happens because time passed.
// The DB is the truth; every job re-reads the trip before acting.
// Idempotent jobIds (trip.reminder:<tripId>) mean re-adding never duplicates.
import { Queue } from 'bullmq';
import config from '@configs/app.config.js';
import { redisClient } from '@src/libs/redis.js';

const connection = {
  host: config.get('redis.host'),
  port: config.get('redis.port'),
  password: config.get('redis.password') || undefined,
  maxRetriesPerRequest: null
};

export const MANDI_QUEUE = 'mandi-trips';

let queueSingleton = null;
export const mandiQueue = () => {
  if (!queueSingleton) queueSingleton = new Queue(MANDI_QUEUE, { connection });
  return queueSingleton;
};

const delayFrom = (when) => Math.max(0, new Date(when).getTime() - Date.now());

/** Add (or replace) a delayed job with an idempotent id. */
async function schedule(name, jobId, runAt, data = {}, opts = {}) {
  await mandiQueue().add(name, data, {
    jobId,
    delay: delayFrom(runAt),
    attempts: opts.attempts ?? 2,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 500,
    removeOnFail: 5000,
    ...opts
  });
}

/** All time-based jobs a scheduled trip needs. */
export async function scheduleTripJobs(trip) {
  const { id, departsAt, bookingCutoffAt } = trip;
  await Promise.all([
    // NOTE: BullMQ forbids ':' in custom jobIds — use '-'
    schedule('trip.booking-cutoff', `trip.booking-cutoff-${id}`, bookingCutoffAt, { tripId: id }),
    schedule('trip.reminder', `trip.reminder-${id}`, new Date(departsAt).getTime() - 60 * 60 * 1000, { tripId: id }),
    schedule('trip.no-start-check', `trip.no-start-check-${id}`, new Date(departsAt).getTime() + 45 * 60 * 1000, { tripId: id }),
    schedule('trip.expire', `trip.expire-${id}`, new Date(departsAt).getTime() + 3 * 60 * 60 * 1000, { tripId: id })
  ]);
}

/** Remove a trip's pending delayed jobs (on cancel / edit / completion). */
export async function removeTripJobs(tripId) {
  const q = mandiQueue();
  await Promise.all(
    ['trip.booking-cutoff', 'trip.reminder', 'trip.no-start-check', 'trip.expire', 'trip.auto-complete', 'trip.stale-location-check']
      .map((n) => q.remove(`${n}-${tripId}`))
  );
}

/** Jobs that only exist while a trip is active. */
export async function scheduleActiveTripJobs(tripId) {
  await Promise.all([
    schedule('trip.auto-complete', `trip.auto-complete-${tripId}`, Date.now() + 12 * 60 * 60 * 1000, { tripId }, { attempts: 1 }),
    schedule('trip.stale-location-check', `trip.stale-location-check-${tripId}`, Date.now() + 5 * 60 * 1000, { tripId }, { attempts: 1 })
  ]);
}

/** One-off notification job with retries + backoff. */
export async function scheduleNotification(phone, message, meta = {}) {
  await schedule('notify.send', null, Date.now(), { phone, message, ...meta }, { attempts: 5 });
}
