const httpStatus = require('http-status');
const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { verify, decode } = require('../../../utils/helpers/jwt-helperv2');
const { UserSessions } = require('../../../models/index');
const { JWTError } = require('../../../utils/custom-errors/class-errors');
const { jwtResponseCodes } = require('../../../common/response-codes');
const { invalidateSession } = require('../../../utils/helpers/token');
const { accessTokenSchema } = require('../../../utils/validators/token');

module.exports.handler = middleware(async ({ body }) => {
  const { token: accessToken } = body;
  const isVerified = await verify(accessToken);

  const userSession = await UserSessions.findOne({
    where: { accessToken },
  });

  // is record is existing and kms successfully verified perform jwt decode
  // else invalidate stagnant record
  if (userSession?.isValid && isVerified) return { data: decode(accessToken), code: jwtResponseCodes.JWT_VERIFIED };
  if (userSession) await invalidateSession(accessToken);

  throw new JWTError(jwtResponseCodes.JWT_INVALID, jwtResponseCodes.JWT_INVALID, httpStatus.UNAUTHORIZED);
}, accessTokenSchema);
