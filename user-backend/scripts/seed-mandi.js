// scripts/seed-mandi.js — seed Mandsaur-area villages, mandis, and a demo driver+trip.
// Run: npm run db:seed:mandi (idempotent: findOrCreate everywhere)
import db from '@src/db/models/index.js';
import { removeTripJobs, scheduleTripJobs } from '@src/services/mandi/tripJobs.service.js';

const { Village, Mandi, MandiUser, Vehicle, Trip, TripStop } = db;

// Approximate real coordinates around Mandsaur, MP
const villages = [
  { nameHi: 'मंदसौर', nameEn: 'Mandsaur', lat: 24.0669, lng: 75.0679 },
  { nameHi: 'मलहारगढ़', nameEn: 'Malhargarh', lat: 24.2969, lng: 75.1669 },
  { nameHi: 'सुवासरा', nameEn: 'Suwasara', lat: 24.1333, lng: 75.6500 },
  { nameHi: 'गरोठ', nameEn: 'Garoth', lat: 24.1500, lng: 75.6500 },
  { nameHi: 'भानपुरा', nameEn: 'Bhanpura', lat: 24.1000, lng: 75.6000 },
  { nameHi: 'दलौदा', nameEn: 'Dalauda', lat: 24.2000, lng: 75.4500 },
  { nameHi: 'शामगढ़', nameEn: 'Shamgarh', lat: 24.1833, lng: 75.6333 }
];

const mandis = [
  { nameHi: 'मंदसौर मंडी', nameEn: 'Mandsaur Mandi', lat: 24.0732, lng: 75.0745 },
  { nameHi: 'मलहारगढ़ मंडी', nameEn: 'Malhargarh Mandi', lat: 24.2985, lng: 75.1680 }
];

const villageRows = [];
for (const v of villages) {
  const [row] = await Village.findOrCreate({ where: { nameEn: v.nameEn }, defaults: v });
  villageRows.push(row);
}
const mandiRows = [];
for (const m of mandis) {
  const [row] = await Mandi.findOrCreate({ where: { nameEn: m.nameEn }, defaults: m });
  mandiRows.push(row);
}

// Demo driver (phone 9999999999) + one open trip tomorrow 6 AM
const [driver] = await MandiUser.findOrCreate({
  where: { phone: '9999999999' },
  defaults: { name: 'डेमो ड्राइवर', role: 'driver', villageId: villageRows[0].id }
});
const [vehicle] = await Vehicle.findOrCreate({
  where: { driverId: driver.id, type: 'tractor' },
  defaults: { driverId: driver.id, type: 'tractor', capacityBori: 120, numberPlate: 'MP-XX-0000' }
});

const existingTrip = await Trip.findOne({ where: { driverId: driver.id, status: 'scheduled' } });
const nowInIndia = new Date(Date.now() + 330 * 60 * 1000);
const departsAt = new Date(Date.UTC(
  nowInIndia.getUTCFullYear(),
  nowInIndia.getUTCMonth(),
  nowInIndia.getUTCDate() + 1,
  0,
  30
));
const bookingCutoffAt = new Date(departsAt.getTime() - 2 * 60 * 60 * 1000);
if (!existingTrip) {
  const trip = await Trip.create({
    driverId: driver.id,
    vehicleId: vehicle.id,
    mandiId: mandiRows[0].id,
    departsAt,
    bookingCutoffAt,
    capacityBori: 120,
    ratePerBori: 15
  });
  await TripStop.bulkCreate(
    [villageRows[0], villageRows[1], villageRows[5]].map((v, i) => ({ tripId: trip.id, villageId: v.id, orderIndex: i }))
  );
  await scheduleTripJobs(trip);
  console.log(`Demo trip created: ${trip.id} (tomorrow 6:00 AM, 120 bori, ₹15/bori)`);
} else {
  await removeTripJobs(existingTrip.id);
  await existingTrip.update({ departsAt, bookingCutoffAt });
  await scheduleTripJobs(existingTrip);
  console.log(`Demo trip refreshed: ${existingTrip.id} (tomorrow 6:00 AM, 120 bori, ₹15/bori).`);
}

console.log(`Seeded: ${villageRows.length} villages, ${mandiRows.length} mandis, demo driver 9999999999.`);
await db.sequelize.close();
process.exit(0);
