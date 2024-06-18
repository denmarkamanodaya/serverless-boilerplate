const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { authVerifyMiddleware: middleware } = require('../../../middlewares/middy');
const { confirmTrustedDeviceSchema } = require('../../../utils/validators/device');
const { verify, decode } = require('../../../utils/helpers/jwt-helperv2');
const { verify: totpVerify } = require('../../../utils/helpers/totp');
const { Devices, UserSessions } = require('../../../models/index');
const { httpResponseCodes, jwtResponseCodes } = require('../../../common/response-codes');
const { IamError } = require('../../../utils/custom-errors/class-errors');
const { getCustomerByMobile } = require('../../../utils/helpers/onboarding-service');
const logger = require('../../../utils/logger');
const { sendSMS, sendEmail } = require('../../../services/notification-service/v2/notification-service');
const { JWTError } = require('../../../utils/custom-errors/class-errors');

module.exports.handler = middleware(
  async ({ decodedToken, body, headers }) => {
    const { mobileNumber: authMobileNo, deviceId: authDeviceId, authUserId: authId } = decodedToken;
    const { inAppOtp } = body;
    const enrollmentToken = headers['x-device-enrollment-token'];
    const isEnrollmentTokenValid = await verify(enrollmentToken);

    if (!isEnrollmentTokenValid)
      throw new JWTError(jwtResponseCodes.JWT_INVALID, jwtResponseCodes.JWT_INVALID, httpStatus.UNAUTHORIZED);

    const { mobileNumber, deviceId, authUserId, type } = decode(enrollmentToken);

    if (authMobileNo !== mobileNumber && authDeviceId !== deviceId && authId !== authUserId && type !== 'enrollment')
      throw new JWTError(jwtResponseCodes.TOKEN_MISMATCH, jwtResponseCodes.TOKEN_MISMATCH, httpStatus.UNAUTHORIZED);

    const device = await Devices.findOne({ where: { mobileInstanceId: deviceId, userId: authUserId } });

    if (!device)
      throw new IamError(httpResponseCodes.DEVICE_NOT_OWNED, httpResponseCodes.DEVICE_NOT_OWNED, httpStatus.UNAUTHORIZED);

    if (!device.accessCode)
      throw new IamError(httpResponseCodes.ACCESS_CODE_EMPTY, httpResponseCodes.ACCESS_CODE_EMPTY, httpStatus.UNAUTHORIZED);

    const isTOTPValid = totpVerify(inAppOtp, device.accessCode, { window: 0, step: 30 });

    if (!isTOTPValid)
      throw new IamError(
        httpResponseCodes.IN_APP_OTP_INVALID.value,
        httpResponseCodes.IN_APP_OTP_INVALID.value,
        httpStatus.UNAUTHORIZED
      );

    // Invalidate users all trusted devices
    await Devices.update(
      {
        trusted: false,
      },
      {
        where: {
          accessCode: { [Op.ne]: null },
          userId: authUserId,
          trusted: true,
        },
      }
    );

    await Promise.all([
      Devices.update(
        {
          trusted: true,
          inAppOtpEnabled: true,
        },
        {
          where: { userId: authUserId, mobileInstanceId: deviceId },
        }
      ),

      UserSessions.update(
        {
          isValid: false,
        },
        {
          where: { accessToken: enrollmentToken },
        }
      ),
    ]);

    // Send notification only if the current device is not trusted
    if (device.makeModel && !device.trusted) {
      const customerDataFetch = await getCustomerByMobile(mobileNumber).catch((e) => {
        logger.info(`[device-enrollment-catch-onboarding-svc] | ${JSON.stringify(e)}`);
      }); // customer data from the onboarding services

      const customerData = customerDataFetch?.data?.data;

      //pass through when unable to send notification due to lack of onboarding data
      if (!customerData || !customerData?.firstName || !customerData?.customerDetails?.emailAddress)
        return { data: httpResponseCodes.DEVICE_HAS_BEEN_TRUSTED, code: httpResponseCodes.VALID };

      const payload = {
        template: process.env.NOTIFICATION_SERVICE_TOGGLE_ON_TEMPLATE_NAME,
        first_name: customerData.firstName,
        make_model: device.makeModel,
        mobileNumber,
        email: customerData.customerDetails.emailAddress,
      };

      //pass through when notification call failed
      await Promise.all([sendSMS(payload), sendEmail(payload)]).catch((e) => {
        logger.info(`[device-enrollment-catch-notification-svc] | ${JSON.stringify(e)}`);
      });
    }

    return { data: httpResponseCodes.DEVICE_HAS_BEEN_TRUSTED, code: httpResponseCodes.VALID };
  },
  confirmTrustedDeviceSchema,
  'authorization'
);
