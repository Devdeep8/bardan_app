// src/db/models/expense.model.js
// One row = one expense entry for a business-local day (diesel, operation,
// maintenance, wages, other). Multiple entries per day are expected — the
// manager logs them as they happen.
export const EXPENSE_CATEGORIES = ['diesel', 'operation', 'maintenance', 'wages', 'other'];

export default (sequelize, DataTypes) => {
  const Expense = sequelize.define('Expense', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    expense_date: {
      // Business-local calendar day (YYYY-MM-DD, Asia/Kolkata)
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(...EXPENSE_CATEGORIES),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    note: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    created_by: {
      // Logical ref to users.id — no FK (loose coupling between backends)
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'expenses',
    underscored: true,
    timestamps: true
  });

  // Serialize to the API contract: snake_case keys, plain numbers
  Expense.prototype.toJSON = function () {
    const values = { ...this.get() };
    return {
      id: values.id,
      expense_date: values.expense_date,
      category: values.category,
      amount: Number(values.amount),
      note: values.note ?? null,
      created_by: values.created_by ?? null,
      created_at: values.createdAt,
      updated_at: values.updatedAt
    };
  };

  return Expense;
};
