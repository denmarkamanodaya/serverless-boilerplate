const { JWT_CONFIG } = require('../../common/constants');
const { UserSessions, Users } = require('../../models/index');
const { decode } = require('../../utils/helpers/jwt-helperv2');
const { JWTError } = require('../custom-errors/class-errors');
const { jwtResponseCodes } = require('../../common/response-codes');
const moment = require('moment');
const httpStatus = require('http-status');

module.exports.createUserSession = async (data) => {
  return await UserSessions.create({
    ...data,
    issuedAt: moment().format(),
    expiryAt: moment().add(JWT_CONFIG.TOKEN_DURATION, JWT_CONFIG.TIME_FORMAT).format(),
    datetime: moment().format(),
    kmsKeyArn: JWT_CONFIG.KMS_KEY,
    isValid: true,
  });
};

module.exports.disableConcurrentLogin = async (data) => {
  const { username } = data;
  const user = await Users.findOne({ where: { username } });
  if (user) {
    return await UserSessions.update(
      {
        isValid: false,
      },
      {
        where: { userId: user.id },
      }
    );
  }
};

module.exports.revokeToken = async (data) => {
  const { token } = data;
  const params = { isValid: false };
  const whereCondition = { where: { accessToken: token }};
  await UserSessions.update(params,whereCondition);
  return { message: jwtResponseCodes.SESSION_REVOKED };
};
