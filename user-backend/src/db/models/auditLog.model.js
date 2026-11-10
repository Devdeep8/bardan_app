// src/db/models/auditLog.model.js
export default (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    actorType: {
      // admin_user | user | system
      type: DataTypes.STRING,
      allowNull: true
    },
    actorEmail: {
      // Denormalized snapshot — survives actor deletion
      type: DataTypes.STRING,
      allowNull: true
    },
    action: {
      // login | login_failed | logout | create | update | delete
      type: DataTypes.STRING,
      allowNull: false
    },
    entity: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entityId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    changedFields: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    before: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    after: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    traceId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    source: {
      // admin-backend | user-backend
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true
  });

  // Logical actor link (no DB constraint — audit rows must outlive deleted actors)
  AuditLog.associate = (models) => {
    if (models.AdminUser) {
      AuditLog.belongsTo(models.AdminUser, {
        foreignKey: 'actorId',
        as: 'actor',
        constraints: false
      });
    }
  };

  return AuditLog;
};
