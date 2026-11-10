// src/db/models/booking.model.js
// Mandi Trip: a farmer's bori reservation on a trip.
// One active booking per farmer per trip — a farmer edits, never duplicates.
export default (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
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
    farmerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'mandi_users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    stopId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'trip_stops', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    boriCount: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    crop: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [['soybean', 'wheat', 'garlic', 'other']] }
    },
    status: {
      // confirmed | cancelled | completed | no_show
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'confirmed',
      validate: { isIn: [['confirmed', 'cancelled', 'completed', 'no_show']] }
    },
    paymentStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'unpaid',
      validate: { isIn: [['unpaid', 'paid']] }
    }
  }, {
    tableName: 'bookings',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['trip_id'] },
      { fields: ['farmer_id'] },
      // one ACTIVE booking per farmer per trip
      {
        name: 'booking_one_active_per_farmer',
        unique: true,
        fields: ['trip_id', 'farmer_id'],
        where: { status: 'confirmed' }
      }
    ]
  });

  Booking.associate = (models) => {
    Booking.belongsTo(models.Trip, { foreignKey: 'tripId', as: 'trip', onDelete: 'CASCADE' });
    Booking.belongsTo(models.MandiUser, { foreignKey: 'farmerId', as: 'farmer', onDelete: 'CASCADE' });
    Booking.belongsTo(models.TripStop, { foreignKey: 'stopId', as: 'stop' });
  };

  return Booking;
};
