'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      actor_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      actor_type: {
        // admin_user | user | system
        type: Sequelize.STRING,
        allowNull: true
      },
      // Denormalized snapshot — audit rows must stay readable after the actor is deleted
      actor_email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      // login | login_failed | logout | create | update | delete
      action: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entity: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entity_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      // { field: { before, after } }
      changed_fields: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      before: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      after: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      ip: {
        type: Sequelize.STRING,
        allowNull: true
      },
      trace_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      // admin-backend | user-backend
      source: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex('audit_logs', ['entity', 'entity_id']);
    await queryInterface.addIndex('audit_logs', ['actor_id', 'created_at']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['trace_id']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('audit_logs');
  }
};
