'use strict';
const { Model } = require('sequelize');

const { NODE_ENV } = process.env;

module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Users.hasMany(models.Devices, { foreignKey: 'userId', ...(NODE_ENV === 'test' ? { constraints: false } : {}) });
      Users.hasMany(models.UserSessions, { foreignKey: 'userId', ...(NODE_ENV === 'test' ? { constraints: false } : {}) });
    }
  }
  Users.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      membershipId: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userDid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdBy: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      updatedBy: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      salt: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      password: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      isActive: {
        allowNull: false,
        defaultValue: true,
        type: DataTypes.BOOLEAN,
      },
    },
    {
      sequelize,
      modelName: 'Users',
      tableName: 'users',
    }
  );
  return Users;
};
