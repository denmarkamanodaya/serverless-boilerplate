const { defaultMiddleware: middleware } = require('../../middlewares/middy');
const { httpResponseCodes } = require('../../common/response-codes');
const logger = require('../../common/logger');
const httpStatus = require('http-status');

module.exports.handler = middleware(async ({ headers, body }) => {
  logger.debug(JSON.stringify({ headers, body }));
  return {
    status: httpStatus.OK,
    code: httpResponseCodes.VALID.value
  };
});
