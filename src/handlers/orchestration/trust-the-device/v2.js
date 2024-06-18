const httpStatus = require('http-status');
const logger = require('../../../common/logger');
const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { trustTheDeviceSchema } = require('../../../utils/validators/orchestration-v2');
const { getCustomerByMobile } = require('../../../utils/helpers/onboarding-service');
const { sendSMS, sendEmail } = require('../../../services/notification-service/v2/notification-service');
const { httpResponseCodes } = require('../../../utils/response-codes');
const { IamError } = require('../../../utils/custom-errors/class-errors');
const { Devices } = require('../../../models/index');

module.exports.handler = middleware(
  async ({ decodedToken, body }) => {
    const { mobileNumber: username, deviceId, authUserId: userId } = decodedToken;
    const { deviceId: mobileInstanceId } = body;

    logger.info(`[trust-the-device] | ${username} | ${mobileInstanceId} | ${deviceId}`);

    if (deviceId !== mobileInstanceId) {
      throw new IamError(httpResponseCodes.DEVICE_NOT_OWNED, httpResponseCodes.DEVICE_NOT_OWNED, httpStatus.UNAUTHORIZED);
    }

    const [deviceObj] = await Promise.all([
      Devices.findOne({ where: { mobileInstanceId, userId } }),

      // Untrust all device associated to the users
      Devices.update(
        {
          trusted: 0,
          updatedBy: userId,
        },
        { where: { userId } }
      ),
    ]);

    const { data: onboardingUser } = await getCustomerByMobile(username).catch((e) => {
      const { data } = e.response;
      logger.debug(`[onboarding-svc-error] | ${JSON.stringify(e)}`);
      const error = new Error(data.data.message);
      error.code = data.code;
      throw error;
    });

    const customerData = onboardingUser.data;
    const notificationPayload = {
      template: process.env.NOTIFICATION_SERVICE_TOGGLE_ON_TEMPLATE_NAME,
      first_name: customerData.firstName,
      make_model: deviceObj.makeModel,
      mobileNumber: username,
      email: customerData.customerDetails.emailAddress,
    };

    await Promise.all([
      // Trust a single device
      Devices.update(
        {
          trusted: 1,
          inAppOtpEnabled: 1,
          updatedBy: userId,
        },
        { where: { userId, mobileInstanceId } }
      ),

      sendSMS(notificationPayload),
      sendEmail(notificationPayload),
    ]);

    return { data: httpResponseCodes.DEVICE_HAS_BEEN_TRUSTED.value, code: httpResponseCodes.VALID.value };
  },
  trustTheDeviceSchema,
  'authorization'
);
