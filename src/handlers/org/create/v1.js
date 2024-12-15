const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { httpResponseCodes } = require('../../../common/response-codes');
const { validateOrgSchema } = require('../../../utils/validators/org');
const { createOrg } = require('../../../utils/helpers/auth0');
const logger = require('../../../common/logger');
const httpStatus = require('http-status');

module.exports.handler = middleware(async ({ headers, body }) => {
  logger.debug(JSON.stringify({ headers, body }));

  createOrg(body.name);

  return {
    status: httpStatus.ACCEPTED,
    code: httpResponseCodes.VALID.value,
    data: httpResponseCodes.ACCEPTED.value,
  };
}, validateOrgSchema);