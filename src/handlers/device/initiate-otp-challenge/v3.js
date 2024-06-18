const httpStatus = require('http-status');
const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { initiateOTPChallengeSchema } = require('../../../utils/validators/device');
const { generateOTP } = require('../../../utils/helpers/mfa');
const { httpResponseCodes, jwtResponseCodes } = require('../../../common/response-codes');
const { JWTError } = require('../../../utils/custom-errors/class-errors');
const { verify, decode } = require('../../../utils/helpers/jwt-helperv2');

module.exports.handler = middleware(
  async ({ decodedToken, headers }) => {
    const { mobileNumber: authMobileNo, deviceId: authDeviceId, authServiceId: authId } = decodedToken;
    const enrollmentToken = headers['x-device-enrollment-token'];
    const isEnrollmentTokenValid = await verify(enrollmentToken);

    if (!isEnrollmentTokenValid)
      throw new JWTError(jwtResponseCodes.JWT_INVALID, jwtResponseCodes.JWT_INVALID, httpStatus.UNAUTHORIZED);

    const { mobileNumber, deviceId, authServiceId, type } = decode(enrollmentToken);

    if (authMobileNo !== mobileNumber && authDeviceId !== deviceId && authId !== authServiceId && type !== 'enrollment')
      throw new JWTError(jwtResponseCodes.TOKEN_MISMATCH, jwtResponseCodes.TOKEN_MISMATCH, httpStatus.UNAUTHORIZED);

    const template = process.env.NOTIFICATION_SERVICE_TOGGLE_ON_OTP_TEMPLATE_NAME;
    const purpose = 'DEVICE_ENROLLMENT';

    const otpId = await generateOTP(mobileNumber, template, purpose);

    return { data: otpId, code: httpResponseCodes.VALID };
  },
  initiateOTPChallengeSchema,
  'authorization'
);
