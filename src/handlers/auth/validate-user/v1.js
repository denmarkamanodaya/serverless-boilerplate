const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { validateUserSchema } = require('../../../utils/validators/user');
const { httpResponseCodes } = require('../../../common/response-codes');
const logger = require('../../../common/logger');
const httpStatus = require('http-status');

module.exports.handler = middleware(async ({ headers, body }) => {
  logger.debug(JSON.stringify({ headers, body }));

  // database validation
  const { username, password } = body;

  const dataSchema = {
    email: username,
    user_id: `${username}`,
    email_verified: true,
    user_metadata: {
        language: "en",
        organizations: [],
    },
    app_metadata: {
        plan: "full"
    },
    mfa_factors: [
        {
            phone: {
                value: "+1234567890",
            }
        }
    ]
  };

  return {
    status: httpStatus.OK,
    code: httpResponseCodes.VALID.value,
    data: dataSchema,
  };
}, validateUserSchema);
