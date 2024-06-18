const httpStatus = require('http-status');
const { verifyUser } = require('../../../utils/helpers/onboarding-service');
const { USER_REGISTRATION_CONFIG } = require('../../../common/constants');
const { validateUserRegMobileVerification } = require('../../../utils/validators/user-registration');
const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { httpResponseCodes } = require('../../../common/response-codes');
const { UserRegError } = require('../../../utils/custom-errors/class-errors');
const { getUser } = require('../../../utils/helpers/user-helper');
const { otps } = require('../../../services/mfa-service/v2/mfa-service');
const logger = require('../../../utils/logger');

module.exports.handler = middleware(async ({ body }) => {
  const { countryCode, mobileNumber } = body;
  const fullMobileNumber = `${countryCode}${mobileNumber}`;
  await verifyUser(fullMobileNumber).catch((e) => {
    const { data } = e.response;

    logger.debug(`[user-registration-catch] | ${JSON.stringify(e)}`);

    const error = new Error(data.data.message);
    error.code = data.code;
    throw error;
  });

  const user = await getUser({ username: fullMobileNumber });
  if (user) {
    throw new UserRegError(httpResponseCodes.USER_EXIST.value, httpResponseCodes.USER_EXIST.value, httpStatus.CONFLICT);
  }
  const payload = {
    username: fullMobileNumber,
    purpose: USER_REGISTRATION_CONFIG.MFA_PURPOSE,
    template: USER_REGISTRATION_CONFIG.TEMPLATE,
  };
  const token = await otps(payload);
  return { code: httpResponseCodes.VALID.value, data: { mfaToken: token } };
}, validateUserRegMobileVerification);
