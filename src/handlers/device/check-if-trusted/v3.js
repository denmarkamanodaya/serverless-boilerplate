const httpStatus = require('http-status');
const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { checkIfTrustedSchema } = require('../../../utils/validators/device');
const { Devices } = require('../../../models/index');
const { IamError } = require('../../../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../../../common/response-codes');
const { sign } = require('../../../utils/helpers/jwt-helperv2');
const { createSecret } = require('../../../utils/helpers/totp');
const logger = require('../../../utils/logger');

module.exports.handler = middleware(
  async ({ decodedToken, pathParameters }) => {
    const { mobileNumber, deviceId: tokenDeviceId, authUserId } = decodedToken;

    // to validate the given old deviceId versus the deviceId-epoch
    // all devices will now be using the deviceId-epoch
    // therefore, we need to check the old deviceId from mobile's given payload
    // othwerise, use the decodedToken deviceId
    const deviceId = pathParameters?.deviceId || tokenDeviceId;

    const device = await Devices.findOne({
      where: {
        userId: authUserId,
        mobileInstanceId: deviceId,
      },
    });

    logger.debug(`[check-device-if-trusted] | ${JSON.stringify(mobileNumber.replace(/.(?=.{4})/g, 'x'))}`);
    logger.info(`[check-device-if-trusted] | ${JSON.stringify(decodedToken)}`);

    if (!device) {
      throw new IamError(httpResponseCodes.DEVICE_NOT_FOUND, httpResponseCodes.DEVICE_NOT_FOUND, httpStatus.NOT_FOUND);
    }

    if (!device.trusted) {
      return { data: { type: 'success' }, code: httpResponseCodes.DEVICE_NOT_TRUSTED };
    }

    //interim support for upstream flow
    if (device.accessCode === null) {
      const secret = createSecret();

      // Update device using tokenId from decodedToken > the new deviceId with epoch
      await Devices.update({ accessCode: secret }, { where: { mobileInstanceId: tokenDeviceId } });
      const type = 'confirmation';
      const token = await sign({
        mobileNumber,
        deviceId: tokenDeviceId,
        authUserId,
        type,
      });

      logger.info(`[check-device-if-trusted] | ${JSON.stringify(token, secret)}`);

      return { data: { type, token, secret }, code: httpResponseCodes.DEVICE_TRUSTED };
    }

    return { data: { type: 'success' }, code: httpResponseCodes.DEVICE_TRUSTED };
  },
  checkIfTrustedSchema,
  'authorization'
);
