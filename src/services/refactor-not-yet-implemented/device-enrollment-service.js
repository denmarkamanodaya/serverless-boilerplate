const httpStatus = require('http-status');
const crypto = require('crypto');
const base32 = require('thirty-two');
const logger = require('../../utils/logger');

const { authenticator } = require('otplib');
const { IamError } = require('../../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../../utils/response-codes');
const { Devices, Users } = require('../../models/index');
const { DEVICE_ENROLLMENT_CONFIG } = require('../../common/constants');
const udUserOnboardingService = require('../ud-user-onboarding/user-onboarding-service');
const { sign, decode } = require('../../utils/helpers/jwt-helperv2');
const { revokeToken } = require('../../utils/helpers/session-helper');
const { otps, verifyNoBearer } = require('../../services/mfa-service/v2/mfa-service');
const { UdNotificationService } = require('../notification-service/notification-service');

const ns = new UdNotificationService();

const totpOptions = { window: 0, step: 30 };

module.exports.checkIfTrusted = async (data) => {
  try {
    // Get mobile# from the current session
    const bearer = data.headers.authorization.split(' ')[1];
    const { mobileNumber, deviceId, authServiceId } = await decode(bearer);

    const device = await Devices.findOne({
      where: {
        userId: authServiceId,
        mobileInstanceId: deviceId,
        trusted: true,
      },
    });

    // Return error if device is not trusted
    if (!device) {
      return this._error({
        statusCode: httpStatus.UNAUTHORIZED,
        responseCode: httpResponseCodes.DEVICE_NOT_TRUSTED.value,
        message: httpResponseCodes.DEVICE_NOT_TRUSTED.value,
      });
    }

    // const type = (device.trusted === false ? "enrollment" : (device.trusted === true && device.accessCode === null ? "confirmation" : "enrolled"));
    // If device is trusted and not yet migrated on our in-house OTP
    if (device.accessCode === null) {
      const secret = await generateAccessCode({ deviceId, mobileNumber, authServiceId });
      const enrollment = await this.initiateEnrollment(data);
      return { type: enrollment.type, token: enrollment.token, secret };
    }

    return { type: 'success' };
  } catch (error) {
    return _error(error);
  }
};

module.exports.initiateEnrollment = async (data) => {
  try {
    // Get mobile# from the current session
    const bearer = data.headers.authorization.split(' ')[1];
    const { mobileNumber, deviceId, authServiceId } = await decode(bearer);
    const device = await Devices.findOne({
      where: {
        userId: authServiceId,
        mobileInstanceId: deviceId,
      },
    });

    const type = device.trusted === true ? 'confirmation' : 'enrollment';

    console.log('AUDIT_TRAIL: ', JSON.stringify({ data, device, type }, null, 2));

    // Generate enrollment token
    const res = await sign({
      mobileNumber,
      deviceId,
      authServiceId,
    });

    return { type, token: res };
  } catch (error) {
    return _error(error);
  }
};

module.exports.otpChallengeGenerate = async (data) => {
  try {
    const enrollmentToken = data.headers['x-device-enrollment-token'];
    const { mobileNumber } = await decode(enrollmentToken);
    // OTP Generation
    const payload = {
      username: mobileNumber,
      purpose: 'MOBILE_NO_VERIFICATION',
      template: process.env.NOTIFICATION_SERVICE_TOGGLE_ON_OTP_TEMPLATE_NAME,
    };
    return await otps(payload);
  } catch (error) {
    return this._error(error);
  }
};

module.exports.otpChallengeValidate = async (data) => {
  try {
    const { otpId, otp } = data.body;
    const enrollmentToken = data.headers['x-device-enrollment-token'];
    const { deviceId, mobileNumber, authServiceId } = await decode(enrollmentToken);

    // OTP validation
    await verifyNoBearer({
      token: otpId,
      otp: otp,
      mobileNumber: mobileNumber,
    });

    // If MFA validation successful, continue to generate in-app Secret
    const secret = await generateAccessCode({ deviceId, mobileNumber, authServiceId });
    return { secret };
  } catch (error) {
    return this._error(error);
  }
};

module.exports.confirmEnrollment = async (data) => {
  try {
    const enrollmentToken = data.headers['x-device-enrollment-token'];
    const { deviceId, mobileNumber, authServiceId } = await decode(enrollmentToken);
    const { inAppOtp } = data.body;
    const secret = await getSecret({ mobileNumber, deviceId });
    const isValid = authenticator.check(inAppOtp, secret, totpOptions);

    if (!isValid) {
      await Devices.update(
        { accessCode: null },
        {
          where: {
            userId: authServiceId,
            mobileInstanceId: deviceId,
          },
        }
      );

      return this._error({
        message: httpResponseCodes.IN_APP_OTP_INVALID.value,
        responseCode: httpResponseCodes.IN_APP_OTP_INVALID.value,
        statusCode: httpStatus.UNAUTHORIZED,
      });
    }

    const deviceAssociation = await checkDeviceAssociation({
      username: mobileNumber,
      mobileInstanceId: deviceId,
    });
    const { makeModel, userId, trusted } = deviceAssociation.Devices[0];

    logger.debug('AUDIT_TRAIL: ', JSON.stringify({ data, secret, isValid, deviceAssociation }, null, 2));

    // Send notification
    if (makeModel && !trusted) {
      const customerData = await udUserOnboardingService.getCustomerByMobile(mobileNumber);
      const payload = {
        template: process.env.NOTIFICATION_SERVICE_TOGGLE_ON_TEMPLATE_NAME,
        first_name: customerData.firstName,
        make_model: makeModel,
        mobileNumber: mobileNumber,
        email: customerData.customerDetails.emailAddress,
      };

      await Promise.all([ns.sendSms(payload), ns.send(payload)]);
    }

    // Update device information
    // enable trusted value
    await Devices.update(
      {
        trusted: 1,
        inAppOtpEnabled: 1,
      },
      {
        where: { userId, mobileInstanceId: deviceId },
      }
    );

    await revokeToken({ token: enrollmentToken });

    return httpResponseCodes.DEVICE_HAS_BEEN_TRUSTED.value;
  } catch (error) {
    return _error(error);
  }
};

module.exports.untrust = async (data) => {
  try {
    // Get mobile# from the current session
    const bearer = data.headers.authorization.split(' ')[1];
    const { deviceId, mobileNumber } = await decode(bearer);

    const deviceAssociation = await checkDeviceAssociation({
      username: mobileNumber,
      mobileInstanceId: deviceId,
    });

    logger.debug('AUDIT_TRAIL: ', JSON.stringify({ data, deviceAssociation }, null, 2));

    const { makeModel, userId } = deviceAssociation.Devices[0];

    if (makeModel) {
      const customerData = await udUserOnboardingService.getCustomerByMobile(mobileNumber);
      const payload = {
        template: process.env.NOTIFICATION_SERVICE_TOGGLE_OFF_TEMPLATE_NAME,
        first_name: customerData.firstName,
        make_model: makeModel,
        mobileNumber: mobileNumber,
        email: customerData.customerDetails.emailAddress,
      };

      await Promise.all([ns.sendSms(payload), ns.send(payload)]);
    }

    // Update device information
    // untrust all devices from that user
    await Devices.update(
      {
        trusted: 0,
        updatedBy: userId,
      },
      {
        where: { userId },
      }
    );

    return httpResponseCodes.DEVICE_HAS_BEEN_UNTRUSTED.value;
  } catch (error) {
    return _error(error);
  }
};

module.exports.validateTOTP = async (data) => {
  try {
    // Get mobile# from the current session
    const bearer = data.headers.authorization.split(' ')[1];
    const { deviceId, mobileNumber, authServiceId } = await decode(bearer);
    const { inAppOtp } = data.body;
    const deviceIdHeaders = data.headers[DEVICE_ENROLLMENT_CONFIG.CUSTOM_HEADER_DEVICE_ID_NAME];
    const secret = await getSecret({ mobileNumber, deviceId });
    const isValid = authenticator.check(inAppOtp, secret, totpOptions);

    console.log(inAppOtp, secret, totpOptions, isValid, deviceId, mobileNumber);

    // Check if device is trusted
    const deviceData = await Devices.findOne({
      where: {
        mobileInstanceId: deviceId,
        userId: authServiceId,
      },
    });

    if (deviceId !== deviceIdHeaders) {
      return _error({
        statusCode: httpStatus.FORBIDDEN,
        responseCode: httpResponseCodes.DEVICE_NOT_OWNED.value,
        message: httpResponseCodes.DEVICE_NOT_OWNED.value,
      });
    }

    if (!deviceData.trusted) {
      return _error({
        statusCode: httpStatus.FORBIDDEN,
        responseCode: httpResponseCodes.DEVICE_NOT_TRUSTED.value,
        message: httpResponseCodes.DEVICE_NOT_TRUSTED.value,
      });
    }

    if (!isValid) {
      return _error({
        message: httpResponseCodes.IN_APP_OTP_INVALID.value,
        responseCode: httpResponseCodes.IN_APP_OTP_INVALID.value,
        statusCode: httpStatus.UNAUTHORIZED,
      });
    }

    return isValid;
  } catch (error) {
    return _error(error);
  }
};

module.exports.generateTOTP = async (data) => {
  const { secret } = data.pathParameters;
  const totp = authenticator.generate(secret);
  return totp;
};

const generateAccessCode = async (data) => {
  try {
    const secretBytes = crypto.randomBytes(20);
    const secret = base32.encode(secretBytes).toString().replace(/=/g, '');
    const { deviceId, authServiceId } = data;
    await Devices.update({ accessCode: secret }, { where: { userId: authServiceId, mobileInstanceId: deviceId } });

    return secret;
  } catch (error) {
    return _error(error);
  }
};

const checkDeviceAssociation = async (data) => {
  try {
    const { username, mobileInstanceId } = data;

    // Check if user data is associated with the device
    // otherwise return DEVICE_NOT_OWNED
    // Basically, you cannot trust device not associated with the user
    const userDevice = await Users.findOne({
      where: { username },
      include: [
        {
          model: Devices,
          where: { mobileInstanceId },
        },
      ],
    });

    return userDevice.toJSON();
  } catch (error) {
    return _error(error);
  }
};

const getSecret = async (data) => {
  const { mobileNumber, deviceId } = data;

  const deviceData = await Users.findOne({
    where: { username: mobileNumber },
    include: [
      {
        model: Devices,
        where: { mobileInstanceId: deviceId },
      },
    ],
  });

  if (!deviceData) {
    return _error({
      message: httpResponseCodes.ACCESS_CODE_EMPTY.value,
      responseCode: httpResponseCodes.ACCESS_CODE_EMPTY.value,
      statusCode: httpStatus.UNAUTHORIZED,
    });
  }

  const { accessCode } = deviceData.toJSON().Devices[0];
  return accessCode;
};

const _error = (error) => {
  console.log(error);
  const errorCode = error?.code ? error.code : httpResponseCodes.DATA_PROCESSING_ERROR.value;
  throw new IamError(
    error?.message,
    error?.responseCode ? error.responseCode : errorCode,
    error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
  );
};
