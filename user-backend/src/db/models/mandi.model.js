// src/db/models/mandi.model.js
// Mandi Trip: destination grain markets
export default (sequelize, DataTypes) => {
  const Mandi = sequelize.define('Mandi', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    nameHi: { type: DataTypes.STRING, allowNull: false },
    nameEn: { type: DataTypes.STRING, allowNull: false },
    lat: { type: DataTypes.DOUBLE, allowNull: false },
    lng: { type: DataTypes.DOUBLE, allowNull: false }
  }, {
    tableName: 'mandis',
    underscored: true,
    timestamps: true
  });

  Mandi.associate = (models) => {
    Mandi.hasMany(models.Trip, { foreignKey: 'mandiId', as: 'trips' });
    Mandi.hasMany(models.MandiStatusReport, { foreignKey: 'mandiId', as: 'statusReports' });
  };

  return Mandi;
};
