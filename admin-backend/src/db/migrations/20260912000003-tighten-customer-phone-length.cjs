'use strict';

// Defense-in-depth: phones are strictly 10 digits (enforced by the API
// schema and model validator); shrink the column itself from VARCHAR(20)
// so even a bypassing write (script/seeder/SQL) cannot store more.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('customers', 'phone', {
      type: Sequelize.STRING(10),
      allowNull: false,
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('customers', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true
    });
  }
};
