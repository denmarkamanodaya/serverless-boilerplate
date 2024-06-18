const httpStatus = require('http-status');
const moment = require('moment');
const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { verifySchema } = require('../../../utils/validators/mfa');
const { ddbOtpEntityv2, ddbOtpCounterEntityv2 } = require('../../../utils/aws/dynamo-db');
const { MFA_OTP_CONFIG } = require('../../../common/constants');
const { MFAError } = require('../../../utils/custom-errors/class-errors');
const { mfaErrorCodes, mfaSuccessCodes } = require('../../../common/mfa-codes');
const { httpResponseCodes } = require('../../../common/response-codes');
const logger = require('../../../utils/helpers/logger');
const { increaseOTPCounter } = require('../../../utils/helpers/counter-helper');

module.exports.handler = middleware(
  async ({ body, decodedToken }) => {
    const { otp, token } = body;
    const { mobileNumber } = decodedToken;

    logger.info(JSON.stringify({ otp, token, mobileNumber }));

    const otpCounterPK = { dataset: MFA_OTP_CONFIG.OTP_COUNTER_DATASET_NAME, sort_key: mobileNumber };
    const otpPK = { dataset: MFA_OTP_CONFIG.DDB_DATASET_NAME, sort_key: `${mobileNumber}|${otp}|${token}` };

    const { Item: otpCounterItem } = await ddbOtpCounterEntityv2.get(otpCounterPK);
    let isLocked = otpCounterItem?.is_locked || false;

    logger.info(typeof otpCounterItem === 'object' ? JSON.stringify(otpCounterItem) : 'No otp counter');

    //Check if otp counter is valid for reset
    if (otpCounterItem?.locked_until && moment().format() > otpCounterItem.locked_until) {
      await ddbOtpCounterEntityv2.update({ ...otpCounterPK, invalid_otp_count: 0, updated_at: moment().format() });
      isLocked = false;
    }

    if (isLocked) throw new MFAError(mfaErrorCodes.SOFT_LOCK, mfaErrorCodes.SOFT_LOCK, httpStatus.UNAUTHORIZED);

    const { Item: otpItem } = await ddbOtpEntityv2.get({ ...otpPK, consistent: true });

    logger.info(typeof otpItem === 'object' ? JSON.stringify(otpItem) : 'No otp');

    if (!otpItem) {
      await increaseOTPCounter(otpCounterPK, otpCounterItem?.invalid_otp_count);
      throw new MFAError(mfaErrorCodes.OTP_INVALID, mfaErrorCodes.OTP_INVALID, httpStatus.BAD_REQUEST);
    }

    if (moment().format() > otpItem.validity_until) {
      await increaseOTPCounter(otpCounterPK, otpCounterItem?.invalid_otp_count);
      throw new MFAError(mfaErrorCodes.OTP_EXPIRED, mfaErrorCodes.OTP_EXPIRED, httpStatus.UNAUTHORIZED);
    }

    if (otpItem.is_used) {
      await increaseOTPCounter(otpCounterPK, otpCounterItem?.invalid_otp_count);
      throw new MFAError(mfaErrorCodes.OTP_USED, mfaErrorCodes.OTP_USED, httpStatus.UNAUTHORIZED);
    }

    await ddbOtpEntityv2.update({ ...otpPK, is_used: true, updated_at: moment().format() });

    return {
      code: httpResponseCodes.VALID.value,
      data: mfaSuccessCodes.VERIFIED,
    };
  },
  verifySchema,
  'authorization'
);
