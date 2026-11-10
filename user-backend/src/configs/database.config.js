// src/configs/database.config.js
import config from './app.config.js';

const commonSetting = {
  define: {
    underscored: true,
    timestamps: true
  },
  pool: {
    max: 10,      // enough for a demo/pitch, even a few concurrent users
    min: 1,        // keep 1 warm so first request isn't slow
    idle: 10000,   // 10s before an idle connection is released
    evict: 1000,   // how often to check for idle connections to evict
    acquire: 30000 // 30s timeout before throwing if no connection is free
  },
  dialect: 'postgres',
  database: config.get('db.name'),
  username: config.get('db.username'),
  password: config.get('db.password'),
  host: config.get('db.host'),
  port: config.get('db.port'),
  dialectOptions: {
    application_name: config.get('app.name')
  },
  logging: false, // turn off SQL logging noise for a demo; flip on if debugging
  migrationStorage: 'sequelize',
  migrationStorageTableName: 'sequelize_migration_meta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_seed_meta'
};

export const development = { ...commonSetting };
export const test = { ...commonSetting };
export const staging = { ...commonSetting };
export const production = { ...commonSetting };

export default {
  development,
  test,
  staging,
  production
};
