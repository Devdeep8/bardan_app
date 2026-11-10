// src/configs/database.cli.cjs
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Locate and load environment variables from root directory.
// Only fill variables that are not already set in the shell, so host-side
// overrides keep working, e.g. DB_WRITE_HOST=127.0.0.1 npm run db:migrate
const envPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const key in envConfig) {
    if (process.env[key] === undefined) {
      process.env[key] = envConfig[key];
    }
  }
}

// `postgres`/`redis` are docker-network service names — they only resolve
// inside docker. When running on the host machine, map them to localhost so
// plain `npm run db:migrate` works both inside and outside the container.
const isRunningInDocker = fs.existsSync('/.dockerenv');
const resolveHost = (host) =>
  (!isRunningInDocker && ['postgres', 'redis'].includes(host) ? '127.0.0.1' : host);

const dbConfig = {
  dialect: 'postgres',
  database: process.env.DB_NAME || 'boat-website-db',
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: resolveHost(process.env.DB_WRITE_HOST || '127.0.0.1'),
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dialectOptions: {
    application_name: process.env.APP_NAME || 'crm-user-backend'
  },
  logging: false,
  migrationStorage: 'sequelize',
  migrationStorageTableName: 'sequelize_migration_meta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_seed_meta'
};

module.exports = {
  development: dbConfig,
  test: dbConfig,
  staging: dbConfig,
  production: dbConfig
};
