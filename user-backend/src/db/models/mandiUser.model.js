// src/db/models/mandiUser.model.js
// Mandi Trip: phone+OTP users (farmers and drivers). Kept separate from the CRM
// User table so the two products never step on each other.
export default (sequelize, DataTypes) => {
  const MandiUser = sequelize.define('MandiUser', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    phone: {
      // normalized 10-digit Indian mobile (E.164 without the +91 prefix)
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      validate: { is: /^[6-9][0-9]{9}$/ }
    },
    name: { type: DataTypes.STRING, allowNull: true },
    role: {
      // 'farmer' | 'driver' — chosen once on first login
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'farmer',
      validate: { isIn: [['farmer', 'driver']] }
    },
    villageId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'villages', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    // captured at registration/login for analytics (Cloudflare CF-IPCountry etc.)
    lastIp: { type: DataTypes.INET, allowNull: true },
    country: { type: DataTypes.STRING(2), allowNull: true }
  }, {
    tableName: 'mandi_users',
    underscored: true,
    timestamps: true
  });

  MandiUser.associate = (models) => {
    MandiUser.belongsTo(models.Village, { foreignKey: 'villageId', as: 'village', onDelete: 'SET NULL' });
    MandiUser.hasMany(models.Trip, { foreignKey: 'driverId', as: 'trips' });
    MandiUser.hasMany(models.Booking, { foreignKey: 'farmerId', as: 'bookings' });
    MandiUser.hasMany(models.Vehicle, { foreignKey: 'driverId', as: 'vehicles' });
  };

  return MandiUser;
};
