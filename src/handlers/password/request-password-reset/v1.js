const { getCustomerByMobile } = require('../../../utils/helpers/onboarding-service');
const { Users } = require('../../../models/index');
const { purposeCode, mfaTemplate } = require('../../../common/mfa-codes');
const { IamError } = require('../../../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../../../common/response-codes');
const httpStatus = require('http-status');
const { fraudCheck } = require('../../../utils/helpers/fraud-monitoring-service');
const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { requestResetPasswordSchema } = require('../../../utils/validators/password');
const { generateOTP } = require('../../../utils/helpers/mfa');
const logger = require('../../../utils/logger');
const { migrateUser } = require('../../../utils/helpers/user-helper');

module.exports.handler = middleware(async ({ headers, body }) => {
  const { mobileNumber: username } = body;

  const onboardingUserFetch = await getCustomerByMobile(username).catch((e) => {
    const { data } = e.response;
    logger.debug(`[onboarding-svc-error] | ${JSON.stringify(e)}`);
    const error = new Error(data.data.message);
    error.code = data.code;
    throw error;
  });
  const onboardingUser = onboardingUserFetch?.data?.data;
  logger.info(`[onboarding] | ${JSON.stringify(onboardingUser)}`);
  logger.info(`[headers] | ${JSON.stringify(headers)}`);
  logger.info(`[body] | ${JSON.stringify(body)}`);
  logger.debug(`[password-request-reset] | ${JSON.stringify(username.replace(/.(?=.{4})/g, 'x'))}`);
  
  let authUser = await Users.findOne({ where: { username } });
  logger.info(`[user db record] | ${JSON.stringify(authUser)}`);
  // check if customer not exists on both onboarding and db user table
  // check if customer not exists in db user table then create user record
  // no checking if user has no kyc yet but registered in db user table
  
  if (!onboardingUser && !authUser) {
    throw new IamError(
      httpResponseCodes.USER_DOES_NOT_EXIST.value,
      httpResponseCodes.USER_DOES_NOT_EXIST.value,
      httpStatus.BAD_REQUEST
    );
  }

  if (!authUser) {
    // create user without password but default is active to true
    authUser =  await migrateUser({username});
    logger.info(`[new user] | ${JSON.stringify(authUser)}`);
  }

  // check if user isActive or not blocked
  if (!authUser.isActive) throw new IamError(httpResponseCodes.USER_LOCKED, httpResponseCodes.USER_LOCKED, httpStatus.LOCKED);

  // For discussion
  // if (onboardingUser.status !== httpStatus.OK) {
  //   throw new IamError(
  //     httpResponseCodes.DATA_PROCESSING_ERROR.value,
  //     httpResponseCodes.DATA_PROCESSING_ERROR.value,
  //     httpStatus.INTERNAL_SERVER_ERROR
  //   );
  // }

  const { id: onboardingId, cid } = onboardingUser;
  // Fraud Monitoring Integration only if cid is available

  if (cid) {
    logger.debug(`[password-request-reset-tmx] | send to tmx`);
    const tmxResponseFetch = await fraudCheck({
      tmxSessionId: headers['x-rttm-session-id'],
      webSessionId: headers['x-rttm-web-session-id'],
      appVersion: headers['x-rttm-app-version'],
      agentVersion: headers['x-rttm-agent'],
      tmxEventType: 'details_change',
      deviceIpAddress: headers['x-original-forwarded-for'] || '',
      customerEventType: 'forgotten_password',
      udCustomerId: `${onboardingId}`,
    }).catch((e) => {
      logger.info(`[tmx-catch] | ${JSON.stringify(e)}`);
    });

    if (tmxResponseFetch && tmxResponseFetch?.data?.data?.disposition !== 'Allow') {
      throw new IamError(httpResponseCodes.TMX_DENY.value, httpResponseCodes.TMX_DENY.value, httpStatus.UNAUTHORIZED);
    }
  }

  // handle user not migrated from ws02
  await Users.findOrCreate({
    where: {
      username,
    },
    defaults: {
      membershipId: onboardingId,
      createdBy: onboardingId,
    },
  });

  try {
    const otpId = await generateOTP(username, mfaTemplate.RESET_PASSWORD_OTP.value, purposeCode.MOBILE_NO_VERIFICATION);
    return { data: { token: otpId }, code: httpResponseCodes.VALID.value };
  } catch (e) {
    logger.debug(`[mfa-catch] | ${JSON.stringify(e)}`);
    throw new IamError(e.message, httpResponseCodes.DATA_PROCESSING_ERROR.value, httpStatus.INTERNAL_SERVER_ERROR);
  }
}, requestResetPasswordSchema);
