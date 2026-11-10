// src/db/models/trip.model.js
// Mandi Trip: the unit of the product — one vehicle run to a mandi.
// booked_bori is the concurrency hotspot: it is only ever moved by a
// conditional UPDATE inside the booking transaction (never plain increments).
export default (sequelize, DataTypes) => {
  const Trip = sequelize.define('Trip', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    driverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'mandi_users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'vehicles', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    mandiId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'mandis', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    departsAt: { type: DataTypes.DATE, allowNull: false },
    bookingCutoffAt: { type: DataTypes.DATE, allowNull: false },
    capacityBori: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    bookedBori: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    ratePerBori: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
    status: {
      // scheduled | active | completed | cancelled | expired
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'scheduled',
      validate: { isIn: [['scheduled', 'active', 'completed', 'cancelled', 'expired']] }
    },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    endedAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'trips',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['status', 'departs_at'] },
      { name: 'trips_driver_idx', fields: ['driver_id'] }
    ]
  });

  Trip.associate = (models) => {
    Trip.belongsTo(models.MandiUser, { foreignKey: 'driverId', as: 'driver', onDelete: 'CASCADE' });
    Trip.belongsTo(models.Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
    Trip.belongsTo(models.Mandi, { foreignKey: 'mandiId', as: 'mandi' });
    Trip.hasMany(models.TripStop, { foreignKey: 'tripId', as: 'stops' });
    Trip.hasMany(models.Booking, { foreignKey: 'tripId', as: 'bookings' });
    Trip.hasOne(models.TripLocationLatest, { foreignKey: 'tripId', as: 'latestLocation' });
  };

  return Trip;
};
