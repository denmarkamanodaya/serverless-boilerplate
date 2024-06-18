const moment = require('moment');
const httpStatus = require('http-status');
const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { USER_REGISTRATION_CONFIG, MFA_OTP_CONFIG } = require('../../../common/constants');
const { userRegOtpVerification } = require('../../../utils/validators/user-registration');
const { ddbUserRegEntityv2, ddbOtpCounterEntityv2, ddbOtpEntityv2 } = require('../../../utils/aws/dynamo-db');
const { sign } = require('../../../utils/helpers/jwt-helperv2');
const { httpResponseCodes } = require('../../../common/response-codes');
const { mfaErrorCodes } = require('../../../common/mfa-codes');
const { MFAError } = require('../../../utils/custom-errors/class-errors');
const { increaseOTPCounter } = require('../../../utils/helpers/counter-helper');
const logger = require('../../../utils/helpers/logger');

module.exports.handler = middleware(async ({ body }) => {
  // Shouldve validated otp x otpId first
  const { otp, token, countryCode, mobileNumber } = body;
  const otpValidationSortKey = `${countryCode}${mobileNumber}|${otp}|${token}`;

  logger.info(`[user-reg-otp-verification] | ${JSON.stringify(mobileNumber.replace(/.(?=.{4})/g, 'x'))}`);

  // Generate primary keys
  const otpCounterPK = { dataset: MFA_OTP_CONFIG.OTP_COUNTER_DATASET_NAME, sort_key: mobileNumber };
  const otpPK = { dataset: MFA_OTP_CONFIG.DDB_DATASET_NAME, sort_key: otpValidationSortKey };

  // Get counter entity
  const { Item: otpCounterItem } = await ddbOtpCounterEntityv2.get(otpCounterPK);
  let isLocked = otpCounterItem?.is_locked || false;

  // Check if otp counter is valid for reset
  if (otpCounterItem?.locked_until && moment().format() > otpCounterItem.locked_until) {
    await ddbOtpCounterEntityv2.update({ ...otpCounterPK, invalid_otp_count: 0, updated_at: moment().format() });
    isLocked = false;
  }

  if (isLocked) throw new MFAError(mfaErrorCodes.SOFT_LOCK, mfaErrorCodes.SOFT_LOCK, httpStatus.UNAUTHORIZED);

  const { Item: otpItem } = await ddbOtpEntityv2.get({ ...otpPK });

  if (!otpItem) {
    await increaseOTPCounter(otpCounterPK, otpCounterItem?.invalid_otp_count);
    throw new MFAError(mfaErrorCodes.OTP_INVALID, mfaErrorCodes.OTP_INVALID, httpStatus.BAD_REQUEST);
  }

  const fullMobileNumber = `${countryCode}${mobileNumber}`;
  const otpSortKey = await sign({ mobileNumber: fullMobileNumber });
  await ddbUserRegEntityv2.put({
    dataset: USER_REGISTRATION_CONFIG.DDB_DATASET_NAME,
    sort_key: otpSortKey,
    otp,
    country_code: countryCode,
    mobile_number: fullMobileNumber,
    is_valid: true,
    created_at: moment().format(),
    updated_at: moment().format(),
  });
  return {
    code: httpResponseCodes.VALID.value,
    data: {
      oneTimeToken: otpSortKey,
    },
  };
}, userRegOtpVerification);
