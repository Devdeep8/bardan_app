// src/db/models/session.model.js
export default (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'user_sessions',
    underscored: true,
    timestamps: true
  });

  Session.associate = (models) => {
    Session.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Session;
};
