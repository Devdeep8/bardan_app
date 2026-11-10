'use strict';

const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');

// Demo login for the crusher plant staff app (dev/staging only).
const DEMO_USER = {
  name: 'Plant Staff',
  email: 'staff@crusher.com'
};
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Staff@123';

module.exports = {
  up: async (queryInterface) => {
    const hashingRounds = parseInt(process.env.HASHING_ROUNDS || '10', 10);
    const existing = await queryInterface.sequelize.query(
      'SELECT id, password FROM users WHERE email = :email',
      {
        replacements: { email: DEMO_USER.email },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );
    const password = await bcrypt.hash(DEMO_PASSWORD, hashingRounds);

    if (existing.length === 0) {
      const now = new Date();
      await queryInterface.bulkInsert('users', [{
        id: randomUUID(),
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        password,
        is_active: true,
        created_at: now,
        updated_at: now
      }]);
    } else if (!(await bcrypt.compare(DEMO_PASSWORD, existing[0].password))) {
      await queryInterface.sequelize.query(
        'UPDATE users SET password = :password, updated_at = NOW() WHERE email = :email',
        { replacements: { password, email: DEMO_USER.email } }
      );
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', { email: DEMO_USER.email });
  }
};
