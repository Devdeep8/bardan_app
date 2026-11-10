// src/db/models/tripLocationLatest.model.js
// Mandi Trip: newest location point per trip (one row per trip).
// Hot path is Redis; this table is the durable mirror for restarts.
export default (sequelize, DataTypes) => {
  const TripLocationLatest = sequelize.define('TripLocationLatest', {
    tripId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: { model: 'trips', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    lat: { type: DataTypes.DOUBLE, allowNull: false },
    lng: { type: DataTypes.DOUBLE, allowNull: false },
    accuracy: { type: DataTypes.FLOAT, allowNull: true },
    speed: { type: DataTypes.FLOAT, allowNull: true },
    recordedAt: { type: DataTypes.DATE, allowNull: false },
    signalLost: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  }, {
    tableName: 'trip_locations_latest',
    underscored: true,
    timestamps: false
  });

  TripLocationLatest.associate = (models) => {
    TripLocationLatest.belongsTo(models.Trip, { foreignKey: 'tripId', as: 'trip', onDelete: 'CASCADE' });
  };

  return TripLocationLatest;
};
