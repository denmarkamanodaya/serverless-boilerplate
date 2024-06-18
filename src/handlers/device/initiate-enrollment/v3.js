const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { initiateEnrollmentSchema } = require('../../../utils/validators/device');
const { Devices } = require('../../../models/index');
const { sign } = require('../../../utils/helpers/jwt-helperv2');
const { httpResponseCodes } = require('../../../common/response-codes');
const { IamError } = require('../../../utils/custom-errors/class-errors');

module.exports.handler = middleware(
  async ({ decodedToken }) => {
    const { mobileNumber, deviceId, authUserId } = decodedToken;

    const device = await Devices.findOne({
      where: {
        mobileInstanceId: deviceId,
      },
    });

    if (!device)
      throw new IamError(httpResponseCodes.DEVICE_NOT_FOUND, httpResponseCodes.DEVICE_NOT_FOUND, httpStatus.NOT_FOUND);

    if (device.trusted && device.userId === authUserId)
      throw new IamError(
        httpResponseCodes.DEVICE_ALREADY_TRUSTED,
        httpResponseCodes.DEVICE_ALREADY_TRUSTED,
        httpStatus.NOT_FOUND
      );

    if (device.trusted && device.userId !== authUserId)
      throw new IamError(httpResponseCodes.DEVICE_NOT_OWNED, httpResponseCodes.DEVICE_NOT_OWNED, httpStatus.FORBIDDEN);

    const userDevice = await Devices.findOne({
      where: {
        userId: authUserId,
        trusted: true,
        mobileInstanceId: { [Op.ne]: deviceId },
      },
    });

    const type = userDevice ? 'enrollment' : 'confirmation';

    const token = await sign({
      mobileNumber,
      deviceId,
      authUserId,
      type,
    });

    return { data: { type, token }, code: httpResponseCodes.VALID };
  },
  initiateEnrollmentSchema,
  'authorization'
);
