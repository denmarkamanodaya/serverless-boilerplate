const httpStatus = require('http-status');
const { defaultMiddleware: middleware } = require('../../middlewares/middy');
const { httpResponseCodes } = require('../../common/response-codes');

module.exports.handler = middleware(async () => ({
  status: httpStatus.ACCEPTED,
  code: httpResponseCodes.VALID.value,
  data: httpResponseCodes.ACCEPTED.value,
}));
