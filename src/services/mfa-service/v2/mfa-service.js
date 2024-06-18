const { customOtpGen } = require('otp-gen-agent');
const { randomUUID } = require('crypto');
const { OTP_GENERATOR_MFA_CONFIG } = require('../../../common/config/otp-generator-config');
const { ddbOtpEntityv2 } = require('../../../utils/aws/dynamo-db');
const { MFA_OTP_CONFIG } = require('../../../common/constants');
const { sendSMS } = require('../../notification-service/v2/notification-servicev2');
const { smsMapperv2 } = require('../../../utils/mappers/notification-mapper');
const { markAsUsed } = require('../../../utils/helpers/mfa-helper');
const { MFAError } = require('../../../utils/custom-errors/class-errors');
const { mfaSuccessCodes, mfaErrorCodes } = require('../../../common/mfa-codes');
const httpStatus = require('http-status');
const logger = require('../../../utils/helpers/logger');
const moment = require('moment');

module.exports.generateOtp = async () => {
  const otp = await customOtpGen(OTP_GENERATOR_MFA_CONFIG);
  return { otp, otpId: randomUUID() };
};

module.exports.otps = async ({ username, template, purpose }) => {
  const { otp, otpId } = await this.generateOtp();
  logger.info(`[mfa-otps] | ${JSON.stringify({ otp, otpId, username, template, purpose })}`);

  await ddbOtpEntityv2.put({
    dataset: MFA_OTP_CONFIG.DDB_DATASET_NAME,
    sort_key: `${username}|${otp}|${otpId}`,
    purpose,
    otp,
    is_used: false,
    duration: MFA_OTP_CONFIG.OTP_DURATION.toString(),
    country_code: username.substring(0, 2),
    transaction_id: otpId,
    mfa_token: otpId,
    validity_until: moment().add(MFA_OTP_CONFIG.OTP_DURATION, MFA_OTP_CONFIG.OTP_TIME_FORMAT).format(),
    created_at: moment().format(),
    updated_at: moment().format(),
  });

  await sendSMS(smsMapperv2({ otp }, template, [username]));
  return otpId;
};

module.exports.verifyNoBearer = async ({ otp, token, mobileNumber }) => {
  const sort_key = `${mobileNumber}|${otp}|${token}`;
  const { Item } = await ddbOtpEntityv2.get({
    dataset: MFA_OTP_CONFIG.DDB_DATASET_NAME,
    sort_key,
  });

  logger.info(`[verify-no-bearer] | ${JSON.stringify({ Item, otp, token, mobileNumber })}`);

  if (!Item) {
    throw new MFAError(mfaErrorCodes.OTP_INVALID.value, mfaErrorCodes.OTP_INVALID.value, httpStatus.BAD_REQUEST);
  }

  markAsUsed({ sort_key });

  return mfaSuccessCodes.VERIFIED.value;
};
