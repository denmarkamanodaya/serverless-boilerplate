const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { httpResponseCodes } = require('../../../common/response-codes');
const { getOrgByName } = require('../../../utils/helpers/auth0');
const logger = require('../../../common/logger');
const httpStatus = require('http-status');

module.exports.handler = middleware(async ({ pathParameters, headers, body }) => {
  logger.debug(JSON.stringify({ headers, body }));

  const response = await getOrgByName(pathParameters.name);

  return {
    status: httpStatus.OK,
    code: httpResponseCodes.VALID.value,
    data: response.data,
  };
});