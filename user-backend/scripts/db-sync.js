// scripts/db-sync.js — create/alter all tables (dev bootstrap; no migration CLI in this service)
import db from '@src/db/models/index.js';

await db.sequelize.sync({ alter: true });
console.log('Database schema synced.');
await db.sequelize.close();
process.exit(0);
