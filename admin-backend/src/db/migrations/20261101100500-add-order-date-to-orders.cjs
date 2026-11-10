'use strict';

// Business-local calendar day an order belongs to (YYYY-MM-DD). Orders can
// now be back-dated — order_date is the ledger key, created_at stays the
// true creation timestamp. Existing rows are backfilled from created_at
// (Asia/Kolkata) so today's behavior is unchanged.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'order_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.sequelize.query(`
      UPDATE orders
      SET order_date = (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date
    `);

    await queryInterface.changeColumn('orders', 'order_date', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });

    // Dashboard lists one day at a time
    await queryInterface.addIndex('orders', ['order_date']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('orders', 'order_date');
  }
};
