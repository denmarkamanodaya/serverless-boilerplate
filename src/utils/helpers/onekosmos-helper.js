const { KosmosService } = require('../../services/kosmos-service');
const { userMapper } = require('../mappers/onekosmos-mapper');

const kosmos = new KosmosService();
const logger = require('./logger');

module.exports.getOneKosmosUser = async ({ username }) => {
  await kosmos.initialize();
  return kosmos.fetchUser(username);
};

module.exports.isOneKosmosUserExists = async ({ username }) => {
  const kosmosUser = await this.getOneKosmosUser({ username });
  logger.info(`[onekosmos-check-user] | ${JSON.stringify({ username, kosmosUser })}`);
  return kosmosUser.page.size > 0;
};

module.exports.createOneKosmosUser = async ({ username }) => {
  const isUserExists = await this.isOneKosmosUserExists({ username });
  logger.info(`[onekosmos] | ${JSON.stringify({ username, isUserExists })}`);
  if (!isUserExists) {
    const payload = userMapper(username);
    const result = await kosmos.createUser(payload);
    logger.info(`[onekosmos-create-user] | ${JSON.stringify({ username, payload, result })}`);
    return true;
  }

  return false;
};

module.exports.getAccessCode = async (acr) => {
  await kosmos.initialize();
  return kosmos.getAccessCode(acr);
};
