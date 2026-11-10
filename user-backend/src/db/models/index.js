// src/db/models/index.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Sequelize } from 'sequelize';
import databaseConfig from '@configs/database.config.js';
import { Logger } from '@src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

const env = process.env.NODE_ENV || 'development';
const config = databaseConfig[env];

const db = {};

let sequelize;
try {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
  Logger.info(`Sequelize initialized for env: ${env}`);
} catch (error) {
  Logger.error('Failed to initialize Sequelize instance', { error: error.message });
  throw error;
}

// Dynamically load all model files in ES Modules
const files = fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  });

for (const file of files) {
  const modelPath = path.join(__dirname, file);
  // Convert path to a file URL (required for ESM dynamic import on all OS platforms)
  const modelURL = pathToFileURL(modelPath).href;
  const modelModule = await import(modelURL);
  
  const modelInit = modelModule.default || modelModule;
  if (typeof modelInit === 'function') {
    const model = modelInit(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  }
}

// Set up model associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// One summary log for all models (instead of a log line per model)
Logger.info('Models loaded', {
  models: Object.keys(db).map((modelName) => ({
    model: modelName,
    associations: Object.keys(db[modelName].associations)
  }))
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
export { sequelize, Sequelize };
