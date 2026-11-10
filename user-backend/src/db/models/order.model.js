// src/db/models/order.model.js
// status is NEVER stored — it is derived from amount_received vs
// total_amount and added to every JSON response.
export const computeOrderStatus = (totalAmount, amountReceived) => {
  const total = Number(totalAmount) || 0;
  const received = Number(amountReceived) || 0;
  if (received <= 0) return 'unpaid';
  if (received >= total) return 'paid';
  return 'partially_paid';
};

export default (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    order_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    order_date: {
      // Business-local calendar day the order belongs to (YYYY-MM-DD) —
      // the day-book key. Orders can be back-dated; created_at remains the
      // true creation timestamp.
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    amount_received: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },

    // --- bahi-khata fields (Phase 1) — nullable at the DB level so sync is
    // safe with pre-existing rows; requiredness is enforced in the handler ---
    village: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    material: {
      type: DataTypes.ENUM('ret', 'gitti', 'both'),
      allowNull: true
    },
    grade: {
      // Free text — founders invent combinations (डबल बारीक साफ, छत की…)
      type: DataTypes.STRING(50),
      allowNull: true
    },
    quantity: {
      // Trolley count
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 999
      }
    },
    rate: {
      // ₹ per trolley
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    payment_type: {
      // Agreed mode (नगद/उधार) — informational only, never affects status
      type: DataTypes.ENUM('nagad', 'udhaar', 'online'),
      allowNull: true
    },
    note: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    tableName: 'orders',
    underscored: true,
    timestamps: true,
    validate: {
      // Instance-level guard: received can never exceed the total
      receivedNotExceedsTotal () {
        if (Number(this.amount_received) > Number(this.total_amount)) {
          throw new Error('amount_received cannot exceed total_amount');
        }
      }
    }
  });

  Order.associate = (models) => {
    // onDelete on the association (not just the column references) so
    // sync({ alter }) keeps RESTRICT instead of Sequelize's SET NULL default
    Order.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer', onDelete: 'RESTRICT' });
  };

  // Serialize to the API contract: snake_case keys, plain numbers (DECIMAL
  // otherwise comes back as a string from pg), and the derived status.
  // Timestamp/FK attributes are whitelisted explicitly because Sequelize's
  // internal attribute names are camelCase even with `underscored` columns.
  Order.prototype.toJSON = function () {
    const values = { ...this.get() };
    const total = Number(values.total_amount);
    const received = Number(values.amount_received);

    const json = {
      id: values.id,
      order_no: values.order_no,
      order_date: values.order_date,
      customer_id: values.customerId ?? values.customer_id,
      total_amount: total,
      amount_received: received,
      status: computeOrderStatus(total, received),
      village: values.village ?? null,
      material: values.material ?? null,
      grade: values.grade ?? null,
      quantity: values.quantity ?? null,
      rate: values.rate == null ? null : Number(values.rate),
      payment_type: values.payment_type ?? null,
      note: values.note ?? null,
      created_at: values.createdAt,
      updated_at: values.updatedAt
    };

    if (values.customer) {
      json.customer = {
        id: values.customer.id,
        name: values.customer.name,
        phone: values.customer.phone,
        preferred_language: values.customer.preferred_language
      };
    }
    return json;
  };

  return Order;
};
