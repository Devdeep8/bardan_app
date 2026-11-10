'use strict';

// Adds the bahi-khata order fields (Phase 1): village, material, grade,
// quantity, rate, payment_type, note — all nullable so pre-existing rows
// stay valid; requiredness is enforced in CreateOrderHandler.
//
// Also repairs two artifacts an earlier `sync({ alter })` run left behind:
// a duplicate order_no unique index and the customer FK flipped from
// ON DELETE RESTRICT to SET NULL.
//
// Idempotent: describeTable guards make it safe to run against a database
// where some columns already exist.

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('orders');

    if (!table.village) {
      await queryInterface.addColumn('orders', 'village', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    if (!table.material) {
      await queryInterface.addColumn('orders', 'material', {
        type: Sequelize.ENUM('ret', 'gitti', 'both'),
        allowNull: true
      });
    }

    if (!table.grade) {
      await queryInterface.addColumn('orders', 'grade', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
    }

    if (!table.quantity) {
      await queryInterface.addColumn('orders', 'quantity', {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: { min: 1, max: 999 }
      });
    }

    if (!table.rate) {
      await queryInterface.addColumn('orders', 'rate', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      });
    }

    if (!table.payment_type) {
      await queryInterface.addColumn('orders', 'payment_type', {
        type: Sequelize.ENUM('nagad', 'udhaar', 'online'),
        allowNull: true
      });
    }

    if (!table.note) {
      await queryInterface.addColumn('orders', 'note', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
    }

    // Drop the duplicate unique index sync({ alter }) created (the original
    // orders_order_no_key constraint stays). It can exist as either a
    // constraint or a bare index depending on how it was created, so try
    // both — each is a no-op when absent.
    await queryInterface.sequelize.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS "orders_order_no_key1"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "orders_order_no_key1"');

    // Restore ON DELETE RESTRICT on the customer FK (the model's contract)
    const [customerFk] = await queryInterface.sequelize.query(
      `SELECT rc.constraint_name, rc.delete_rule
         FROM information_schema.referential_constraints rc
         JOIN information_schema.key_column_usage kcu
           ON kcu.constraint_name = rc.constraint_name
        WHERE kcu.table_name = 'orders'
          AND kcu.column_name = 'customer_id'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (customerFk && customerFk.delete_rule !== 'RESTRICT') {
      await queryInterface.removeConstraint('orders', customerFk.constraint_name);
      await queryInterface.addConstraint('orders', {
        type: 'FOREIGN KEY',
        fields: ['customer_id'],
        references: { table: 'customers', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('orders');
    const columns = ['village', 'material', 'grade', 'quantity', 'rate', 'payment_type', 'note'];

    for (const column of columns) {
      if (table[column]) {
        await queryInterface.removeColumn('orders', column);
      }
    }

    // ENUM types outlive their columns in Postgres — clean them up too
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_material"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_payment_type"');
  }
};
