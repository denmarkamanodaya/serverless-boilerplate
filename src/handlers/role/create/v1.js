const httpStatus = require('http-status');
const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { validateRoleSchema } = require('../../../utils/validators/role');
const { httpResponseCodes } = require('../../../common/response-codes');
const { createRole } = require('../../../utils/helpers/auth0');
const logger = require('../../../common/logger');

module.exports.handler = middleware(async ({ headers, body }) => {
  logger.debug(JSON.stringify({ headers, body }));

  createRole(body.name);

  return {
    status: httpStatus.ACCEPTED,
    code: httpResponseCodes.VALID.value,
    data: httpResponseCodes.ACCEPTED.value,
  };
}, validateRoleSchema);
