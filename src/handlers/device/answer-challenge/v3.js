const httpStatus = require('http-status');
const { createSecret } = require('../../../utils/helpers/totp');
const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { answerChallengeSchema } = require('../../../utils/validators/device');
const { mfaErrorCodes } = require('../../../common/mfa-codes');
const { httpResponseCodes, jwtResponseCodes } = require('../../../common/response-codes');
const { Devices } = require('../../../models/index');
const { JWTError, MFAError } = require('../../../utils/custom-errors/class-errors');
const { verify, decode } = require('../../../utils/helpers/jwt-helperv2');
const { ddbOtpEntityv2 } = require('../../../utils/aws/dynamo-db');
const { MFA_OTP_CONFIG } = require('../../../common/constants');

module.exports.handler = middleware(
  async ({ decodedToken, body, headers }) => {
    const { otp, otpId } = body;
    const { mobileNumber: authMobileNo, deviceId: authDeviceId, authUserId: authId } = decodedToken;
    const enrollmentToken = headers['x-device-enrollment-token'];
    const isEnrollmentTokenValid = await verify(enrollmentToken);

    if (!isEnrollmentTokenValid)
      throw new JWTError(jwtResponseCodes.JWT_INVALID, jwtResponseCodes.JWT_INVALID, httpStatus.UNAUTHORIZED);

    const { mobileNumber, deviceId, authUserId, type } = decode(enrollmentToken);

    if (authMobileNo !== mobileNumber && authDeviceId !== deviceId && authId !== authUserId && type !== 'enrollment')
      throw new JWTError(jwtResponseCodes.TOKEN_MISMATCH, jwtResponseCodes.TOKEN_MISMATCH, httpStatus.UNAUTHORIZED);

    const { Item } = await ddbOtpEntityv2.get({
      dataset: MFA_OTP_CONFIG.DDB_DATASET_NAME,
      sort_key: `${mobileNumber}|${otp}|${otpId}`,
    });

    if (!Item) throw new MFAError(mfaErrorCodes.OTP_INVALID, mfaErrorCodes.OTP_INVALID, httpStatus.BAD_REQUEST);
    const secret = createSecret();
    await Devices.update({ accessCode: secret }, { where: { userId: authUserId, mobileInstanceId: deviceId } });

    return { data: secret, code: httpResponseCodes.VALID };
  },
  answerChallengeSchema,
  'authorization'
);
