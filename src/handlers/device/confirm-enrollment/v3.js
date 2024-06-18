const httpStatus = require('http-status');
const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { confirmEnrollmentSchema } = require('../../../utils/validators/device');
const { verify, decode, sign } = require('../../../utils/helpers/jwt-helperv2');
const { Devices } = require('../../../models/index');
const { httpResponseCodes, jwtResponseCodes } = require('../../../common/response-codes');
const { JWTError } = require('../../../utils/custom-errors/class-errors');

module.exports.handler = middleware(
  async ({ headers, decodedToken }) => {
    const { mobileNumber: authMobileNo, deviceId: authDeviceId, authUserId: authId } = decodedToken;
    const confirmationToken = headers['x-device-confirmation-token'];
    const isConfirmationTokenValid = await verify(confirmationToken);

    if (!isConfirmationTokenValid)
      throw new JWTError(jwtResponseCodes.JWT_INVALID, jwtResponseCodes.JWT_INVALID, httpStatus.UNAUTHORIZED);

    const { mobileNumber, deviceId, authUserId, type } = decode(confirmationToken);

    if (authMobileNo !== mobileNumber && authDeviceId !== deviceId && authId !== authUserId && type !== 'confirmation')
      throw new JWTError(jwtResponseCodes.TOKEN_MISMATCH, jwtResponseCodes.TOKEN_MISMATCH, httpStatus.UNAUTHORIZED);

    //invalidate all user's devices
    await Devices.update(
      { trusted: false },
      {
        where: {
          userId: authUserId,
          trusted: true,
        },
      }
    );

    const token = await sign({
      mobileNumber,
      deviceId,
      authUserId,
      type: 'enrollment',
    });

    return { data: { type: 'enrollment', token }, code: httpResponseCodes.VALID };
  },
  confirmEnrollmentSchema,
  'authorization'
);
