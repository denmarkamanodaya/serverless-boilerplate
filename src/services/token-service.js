const { jwtResponseCodes } = require('../common/response-codes');
const { UserSessions } = require('../models/index');
const { JWTError } = require('../utils/custom-errors/class-errors');
const httpStatus = require('http-status');

const invalidateSession = async (accessToken) => await UserSessions.update({ isValid: false }, { where: { accessToken } });

module.exports.verify = async (accessToken) => {
  const isVerified = await verify(accessToken);

  const userSession = await UserSessions.findOne({
    where: { accessToken },
  });

  // is record is existing and kms successfully verified perform jwt decode
  // else invalidate stagnant record
  if (userSession?.isValid && isVerified) return decode(accessToken);
  if (userSession) await invalidateSession(accessToken);

  throw new JWTError(jwtResponseCodes.JWT_INVALID, jwtResponseCodes.JWT_INVALID, httpStatus.UNAUTHORIZED);
};

module.exports.revoke = async (accessToken) => {
  const isVerified = await verify(accessToken);

  if (isVerified) await invalidateSession(accessToken);

  return { message: jwtResponseCodes.SESSION_REVOKED };
};
