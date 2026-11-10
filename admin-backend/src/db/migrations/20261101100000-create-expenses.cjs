'use strict';

// Daily plant expenses (diesel, operation, etc.) recorded by the manager
// from the machine. expense_date is a business-local calendar day (DATEONLY,
// YYYY-MM-DD in Asia/Kolkata) — not a timestamp — so a day's ledger is a
// simple date match regardless of when the entry was typed in.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('expenses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      expense_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('diesel', 'operation', 'maintenance', 'wages', 'other'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      note: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      created_by: {
        // Logical ref to users.id (user-backend) — no FK, same convention as
        // audit_logs.actor_id, so the two backends stay loosely coupled.
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Expenses view lists one day at a time
    await queryInterface.addIndex('expenses', ['expense_date']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('expenses');
  }
};
