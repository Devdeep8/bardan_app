'use strict';

// Adds login credentials (name + hashed password) to the existing users table,
// mirroring admin_users in the admin backend.
//
// Columns are added as nullable at the DB level so the migration never fails
// against pre-existing rows; the Sequelize model enforces presence at the
// application layer (all users are created by seeders/registration code).
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'name', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    await queryInterface.addColumn('users', 'last_login_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'last_login_at');
    await queryInterface.removeColumn('users', 'is_active');
    await queryInterface.removeColumn('users', 'password');
    await queryInterface.removeColumn('users', 'name');
  }
};
