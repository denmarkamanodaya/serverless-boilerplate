const { BAAS_GRANT_TYPE } = require('../../common/constants');
const baasService = require('../../services/baas-service');
const logger = require('../logger');

module.exports.wso2Login = async (data) => {
  try {
    const { username, password } = data;
    return true;
    // return await baasService.loginv2({ username, password }, BAAS_GRANT_TYPE.PASSWORD);
    // // return true;
  } catch (e) {
    logger.debug(`[wso2-error] | ${e}`);
  }
};
