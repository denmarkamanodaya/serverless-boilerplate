const httpStatus = require('http-status');
const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { untrustSchema } = require('../../../utils/validators/device');
const { Devices } = require('../../../models/index');
const { sendTransactionalNotification } = require('../../../utils/helpers/notification-service');
const { getCustomerByMobile } = require('../../../utils/helpers/onboarding-service');
const { IamError } = require('../../../utils/custom-errors/class-errors');
const { httpResponseCodes, jwtResponseCodes } = require('../../../common/response-codes');
const { JWTError } = require('../../../utils/custom-errors/class-errors');
const logger = require('../../../utils/logger');

module.exports.handler = middleware(
  async ({ decodedToken, pathParameters }) => {
    const { deviceId, mobileNumber, authUserId } = decodedToken;

    //unauthorized
    if (deviceId !== pathParameters.deviceId)
      throw new JWTError(jwtResponseCodes.JWT_INVALID, jwtResponseCodes.JWT_INVALID, httpStatus.UNAUTHORIZED);

    const device = await Devices.findOne({
      where: {
        mobileInstanceId: deviceId,
        userId: authUserId,
      },
    });

    if (!device)
      throw new IamError(httpResponseCodes.DEVICE_NOT_FOUND, httpResponseCodes.DEVICE_NOT_FOUND, httpStatus.NOT_FOUND);

    if (!device.trusted)
      throw new IamError(httpResponseCodes.DEVICE_NOT_TRUSTED, httpResponseCodes.DEVICE_NOT_TRUSTED, httpStatus.FORBIDDEN);

    const customerDataFetch = await getCustomerByMobile(mobileNumber).catch((e) => {
      logger.debug(`[onboarding-svc-error] | ${JSON.stringify(e)}`);
    });

    const customerData = customerDataFetch?.data?.data;

    await Promise.all([
      Devices.update(
        {
          trusted: false,
          acecssCode: null,
          updatedBy: authUserId,
        },
        {
          where: {
            mobileInstanceId: deviceId,
            userId: authUserId,
          },
        }
      ),

      sendTransactionalNotification({
        type: 'sms',
        data: { make_model: device.makeModel },
        recipients: [mobileNumber],
        templateName: process.env.NOTIFICATION_SERVICE_TOGGLE_OFF_TEMPLATE_NAME,
        senderName: process.env.NOTIFICATION_SERVICE_SMS_SENDER_NAME,
      }).catch((e) => {
        logger.debug(`[notification-svc-error] | ${JSON.stringify(e)}`);
      }),

      ...(customerData?.customerDetails?.emailAddress && customerData?.customerDetails?.emailAddress
        ? [
            sendTransactionalNotification({
              type: 'email',
              data: { first_name: customerData.firstName, make_model: device.makeModel },
              recipients: [customerData.customerDetails.emailAddress],
              templateName: process.env.NOTIFICATION_SERVICE_TOGGLE_OFF_TEMPLATE_NAME,
              senderName: process.env.NOTIFICATION_SERVICE_EMAIL_SENDER_NAME,
            }).catch((e) => {
              logger.debug(`[notification-svc-error] | ${JSON.stringify(e)}`);
            }),
          ]
        : []),
    ]);

    return { data: httpResponseCodes.DEVICE_HAS_BEEN_UNTRUSTED.value, code: httpResponseCodes.VALID.value };
  },
  untrustSchema,
  'authorization'
);
