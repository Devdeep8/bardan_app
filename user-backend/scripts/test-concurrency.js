// scripts/test-concurrency.js — prove the last-bori race is safe.
// Creates two farmers, leaves exactly 10 bori on the seeded demo trip,
// fires two simultaneous 10-bori bookings, and asserts exactly one wins.
import jwt from 'jsonwebtoken';
import db from '@src/db/models/index.js';

const { MandiUser, Trip, Booking } = db;
const API = `http://localhost:${process.env.PORT || 3011}`;

const secret = process.env.JWT_LOGIN_SECRET || 'your_super_secret_login_token_key_here';
const tokenFor = (id) => jwt.sign({ sub: id, type: 'access', scope: 'mandi' }, secret, { expiresIn: '1h' });

async function upsertFarmer(phone) {
  const [u] = await MandiUser.findOrCreate({ where: { phone }, defaults: { role: 'farmer' } });
  return u;
}

const trip = await Trip.findOne({ where: { status: 'scheduled' }, order: [['created_at', 'DESC']] });
if (!trip) throw new Error('No scheduled trip — run npm run db:seed:mandi first');

const [a, b] = await Promise.all([upsertFarmer('9111100001'), upsertFarmer('9111100002')]);

// reset state and leave exactly 10 bori free
await Booking.update({ status: 'cancelled' }, { where: { tripId: trip.id, status: 'confirmed' } });
await trip.update({ bookedBori: 0, capacityBori: 10 });

const [stop] = await trip.getStops();
const book = (user, bori) => fetch(`${API}/api/v1/mandi/trips/${trip.id}/bookings`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${tokenFor(user.id)}` },
  body: JSON.stringify({ villageId: stop.villageId, boriCount: bori, crop: 'wheat' })
}).then((r) => r.json());

const [ra, rb] = await Promise.all([book(a, 10), book(b, 10)]);
await trip.reload();

const wins = [ra, rb].filter((r) => r.success).length;
console.log('farmer A:', ra.success ? 'BOOKED' : ra.errors.message);
console.log('farmer B:', rb.success ? 'BOOKED' : rb.errors.message);
console.log('bookedBori after:', trip.bookedBori);

if (wins === 1 && trip.bookedBori === 10) {
  console.log('PASS: exactly one booking won, no overbooking.');
} else {
  console.error(`FAIL: wins=${wins}, bookedBori=${trip.bookedBori}`);
  process.exitCode = 1;
}

// cleanup: restore generous capacity for manual testing
await trip.update({ capacityBori: 120 });
await db.sequelize.close();
process.exit(process.exitCode || 0);
