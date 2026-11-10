// src/db/models/customer.model.js
// Attributes use snake_case names so API responses match the frontend
// contract (phone, name, preferred_language) without a mapping layer.
export default (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[0-9]{10}$/
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    preferred_language: {
      type: DataTypes.ENUM('hi', 'en'),
      allowNull: false,
      defaultValue: 'hi'
    }
  }, {
    tableName: 'customers',
    underscored: true,
    timestamps: true
  });

  Customer.associate = (models) => {
    Customer.hasMany(models.Order, { foreignKey: 'customerId', as: 'orders' });
  };

  return Customer;
};
