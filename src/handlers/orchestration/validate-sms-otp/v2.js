const httpStatus = require('http-status');
const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { validateSmsOtp } = require('../../../utils/validators/orchestration-v2');
const { mfaSuccessCodes } = require('../../../common/mfa-codes');
const { ddbOtpEntityv2 } = require('../../../utils/aws/dynamo-db');
const { MFA_OTP_CONFIG } = require('../../../common/constants');
const { mfaErrorCodes } = require('../../../common/mfa-codes');
const { MFAError } = require('../../../utils/custom-errors/class-errors');

module.exports.handler = middleware(
  async ({ decodedToken, body }) => {
    const { otp, otpId } = body;
    const { mobileNumber } = decodedToken;

    const { Item } = await ddbOtpEntityv2.get({
      dataset: MFA_OTP_CONFIG.DDB_DATASET_NAME,
      sort_key: `${mobileNumber}|${otp}|${otpId}`,
    });

    if (!Item) throw new MFAError(mfaErrorCodes.OTP_INVALID, mfaErrorCodes.OTP_INVALID, httpStatus.BAD_REQUEST);

    // counter
    return { data: mfaSuccessCodes.VERIFIED.value };
  },
  validateSmsOtp,
  'authorization'
);
