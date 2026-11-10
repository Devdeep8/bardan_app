// src/db/models/mandiStatusReport.model.js
// Mandi Trip: crowd-sourced gate status (open / closed / long_queue)
export default (sequelize, DataTypes) => {
  const MandiStatusReport = sequelize.define('MandiStatusReport', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    mandiId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'mandis', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'mandi_users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [['open', 'closed', 'long_queue']] }
    }
  }, {
    tableName: 'mandi_status_reports',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['mandi_id', 'created_at'] }]
  });

  MandiStatusReport.associate = (models) => {
    MandiStatusReport.belongsTo(models.Mandi, { foreignKey: 'mandiId', as: 'mandi', onDelete: 'CASCADE' });
    MandiStatusReport.belongsTo(models.MandiUser, { foreignKey: 'reporterId', as: 'reporter', onDelete: 'CASCADE' });
  };

  return MandiStatusReport;
};
