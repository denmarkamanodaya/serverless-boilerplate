const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { verify } = require('../../../utils/helpers/jwt-helperv2');
const { invalidateSession } = require('../../../utils/helpers/token');
const { jwtResponseCodes } = require('../../../common/response-codes');
const { accessTokenSchema } = require('../../../utils/validators/token');

module.exports.handler = middleware(async ({ body }) => {
  const { token: accessToken } = body;
  const isVerified = await verify(accessToken);

  if (isVerified) await invalidateSession(accessToken);

  return { code: jwtResponseCodes.SESSION_REVOKED };
}, accessTokenSchema);
