import fs from 'fs';
import path from 'path';

const name = process.argv[2];
if (!name) {
  console.error('Please specify a migration name. Example: npm run db:migration:create create-users');
  process.exit(1);
}

// Generate timestamp in YYYYMMDDHHMMSS format
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const timestamp = now.getFullYear() +
  pad(now.getMonth() + 1) +
  pad(now.getDate()) +
  pad(now.getHours()) +
  pad(now.getMinutes()) +
  pad(now.getSeconds());

const filename = `${timestamp}-${name}.cjs`;
const dir = path.resolve('src', 'db', 'migrations');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const template = `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
`;

fs.writeFileSync(path.join(dir, filename), template);
console.log(`Created migration file: src/db/migrations/${filename}`);
