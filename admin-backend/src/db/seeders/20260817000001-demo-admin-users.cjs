'use strict';

const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');

const DEMO_ADMINS = [
  {
    name: 'Super Admin',
    email: 'superadmin@crm.com',
    password: 'Admin@123',
    role: 'super_admin'
  },
  {
    name: 'Content Editor',
    email: 'editor@crm.com',
    password: 'Editor@123',
    role: 'editor'
  }
];

module.exports = {
  up: async (queryInterface) => {
    const hashingRounds = parseInt(process.env.HASHING_ROUNDS || '10', 10);
    const now = new Date();

    const rows = await Promise.all(DEMO_ADMINS.map(async (admin) => ({
      id: randomUUID(),
      name: admin.name,
      email: admin.email,
      password: await bcrypt.hash(admin.password, hashingRounds),
      role: admin.role,
      is_active: true,
      created_at: now,
      updated_at: now
    })));

    await queryInterface.bulkInsert('admin_users', rows, {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('admin_users', {
      email: DEMO_ADMINS.map(admin => admin.email)
    }, {});
  }
};
