const sequelize = require('../../src/models/index');
const logger = require('../../src/common/logger');

const sync = async () => {
  try {
    await sequelize.sequelize.sync({ force: true });
  } catch (error) {
    logger.debug(error);
  }
};

const drop = async () => {
  try {
    await sequelize.sequelize.drop();
  } catch (error) {
    logger.debug(error);
  }
};

const closeConnection = async () => {
  try {
    await sequelize.sequelize.close();
  } catch (error) {
    logger.debug(error);
  }
};

const checkDbConnection = async () => {
  try {
    await sequelize.sequelize.authenticate();
    logger.info('Connection has been established successfully.');
  } catch (error) {
    logger.error(error);
  }
};

const seed = async (entity, data, opts) => {
  try {
    await sequelize[entity].create(data, opts);
  } catch (error) {
    console.log(error);
    logger.error(error);
  }
};

module.exports = {
  sync,
  closeConnection,
  checkDbConnection,
  drop,
  seed,
};
