const httpStatus = require('http-status');
const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { totpValidateSchema } = require('../../../utils/validators/device');
const { Devices } = require('../../../models/index');
const { IamError } = require('../../../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../../../common/response-codes');
const { verify } = require('../../../utils/helpers/totp');

module.exports.handler = middleware(
  async ({ decodedToken, body, headers }) => {
    const { deviceId: authDeviceId, authUserId } = decodedToken;
    const { inAppOtp } = body;
    const deviceId = headers['x-ud-device-id'];

    if (authDeviceId !== deviceId)
      throw new IamError(
        httpResponseCodes.DEVICE_NOT_OWNED.value,
        httpResponseCodes.DEVICE_NOT_OWNED.value,
        httpStatus.UNAUTHORIZED
      );

    const device = await Devices.findOne({
      where: {
        userId: authUserId,
        mobileInstanceId: deviceId,
        trusted: true,
      },
    });

    if (!device)
      throw new IamError(
        httpResponseCodes.DEVICE_NOT_TRUSTED,
        httpResponseCodes.DEVICE_NOT_TRUSTED,
        httpStatus.UNAUTHORIZED
      );

    if (!device.accessCode)
      throw new IamError(httpResponseCodes.ACCESS_CODE_EMPTY, httpResponseCodes.ACCESS_CODE_EMPTY, httpStatus.UNAUTHORIZED);

    if (!device.inAppOtpEnabled)
      throw new IamError(
        httpResponseCodes.IN_APP_OTP_DISABLED,
        httpResponseCodes.IN_APP_OTP_DISABLED,
        httpStatus.UNAUTHORIZED
      );

    const isTOTPValid = verify(inAppOtp, device.accessCode, { window: 0, step: 30 });
    console.log(inAppOtp, isTOTPValid, device);
    if (!isTOTPValid)
      throw new IamError(
        httpResponseCodes.IN_APP_OTP_INVALID.value,
        httpResponseCodes.IN_APP_OTP_INVALID.value,
        httpStatus.UNAUTHORIZED
      );

    return { data: isTOTPValid, code: httpResponseCodes.IN_APP_OTP_VERIFIED };
  },
  totpValidateSchema,
  'authorization'
);
