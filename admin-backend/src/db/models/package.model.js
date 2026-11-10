// src/db/models/package.model.js
export default (sequelize, DataTypes) => {
  const Package = sequelize.define('Package', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true
    },
    capacity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    price: {
      type: DataTypes.STRING,
      allowNull: true
    },
    priceUnit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    highlights: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    gradient: {
      type: DataTypes.STRING,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'packages',
    underscored: true,
    timestamps: true,
    paranoid: true
  });

  return Package;
};
