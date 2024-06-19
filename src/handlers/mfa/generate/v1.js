const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { httpResponseCodes } = require('../../../common/response-codes');
const logger = require('../../../common/logger');

module.exports.handler = middleware(async ({ headers, body }) => {
  logger.debug(JSON.stringify({ headers, body }));
  return {
    code: httpResponseCodes.VALID.value,
    data: httpResponseCodes.ACCEPTED.value,
  };
});
