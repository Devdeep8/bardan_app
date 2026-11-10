// src/db/models/tripStop.model.js
// Mandi Trip: ordered pickup villages on a trip
export default (sequelize, DataTypes) => {
  const TripStop = sequelize.define('TripStop', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    tripId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'trips', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    villageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'villages', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    eta: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'trip_stops',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['village_id'] }]
  });

  TripStop.associate = (models) => {
    TripStop.belongsTo(models.Trip, { foreignKey: 'tripId', as: 'trip', onDelete: 'CASCADE' });
    TripStop.belongsTo(models.Village, { foreignKey: 'villageId', as: 'village' });
    TripStop.hasMany(models.Booking, { foreignKey: 'stopId', as: 'bookings' });
  };

  return TripStop;
};
