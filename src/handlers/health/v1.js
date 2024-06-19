const httpStatus = require('http-status');
const { defaultMiddleware: middleware } = require('../../middlewares/middy');
const { httpResponseCodes } = require('../../common/response-codes');
const { healthSchema } = require('../../utils/validators/health');
const logger = require('../../common/logger');

module.exports.handler = middleware(async ({ headers, body }) => {
  logger.debug(JSON.stringify({ headers, body }));
  return {
    status: httpStatus.ACCEPTED,
    code: httpResponseCodes.VALID.value,
    data: httpResponseCodes.ACCEPTED.value,
  };
}, healthSchema);
