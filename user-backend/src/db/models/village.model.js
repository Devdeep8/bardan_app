// src/db/models/village.model.js
// Mandi Trip: villages served by drivers (pickup points)
export default (sequelize, DataTypes) => {
  const Village = sequelize.define('Village', {
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
    tableName: 'villages',
    underscored: true,
    timestamps: true
  });

  Village.associate = (models) => {
    Village.hasMany(models.TripStop, { foreignKey: 'villageId', as: 'tripStops' });
  };

  return Village;
};
