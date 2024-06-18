'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true,
      },
      userDid: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      membershipId: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      username: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      createdBy: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      updatedBy: {
        allowNull: true,
        type: Sequelize.STRING,
      },
    });
    await queryInterface.addIndex('users', ['id', 'userDid', 'username', 'createdAt', 'updatedAt']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  },
};
