// src/db/models/vehicle.model.js
// Mandi Trip: a driver's tractor/tempo
export default (sequelize, DataTypes) => {
  const Vehicle = sequelize.define('Vehicle', {
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
    type: {
      // 'tractor' | 'tempo'
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [['tractor', 'tempo']] }
    },
    capacityBori: { type: DataTypes.INTEGER, allowNull: false },
    maxWeightKg: { type: DataTypes.INTEGER, allowNull: true },
    numberPlate: { type: DataTypes.STRING, allowNull: true }
  }, {
    tableName: 'vehicles',
    underscored: true,
    timestamps: true
  });

  Vehicle.associate = (models) => {
    Vehicle.belongsTo(models.MandiUser, { foreignKey: 'driverId', as: 'driver', onDelete: 'CASCADE' });
    Vehicle.hasMany(models.Trip, { foreignKey: 'vehicleId', as: 'trips' });
  };

  return Vehicle;
};
