const Joi = require('joi');

const validateDeviceEnrollment = {
  headers: Joi.object()
    .keys({
      'x-ud-device-make-model': Joi.string().required(),
      'x-ud-device-id': Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

const validateDeviceEnrollmentToken = {
  headers: Joi.object()
    .keys({
      'x-device-enrollment-token': Joi.string().required(),
      'x-ud-device-id': Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

const validateDeviceEnrollmentOtp = {
  body: Joi.object()
    .keys({
      otp: Joi.string().required(),
      otpId: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
  headers: Joi.object()
    .keys({
      'x-device-enrollment-token': Joi.string().required(),
      'x-ud-device-id': Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

const validateDeviceEnrollmentConfirmation = {
  body: Joi.object()
    .keys({
      inAppOtp: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
  headers: Joi.object()
    .keys({
      'x-device-enrollment-token': Joi.string().required(),
      'x-ud-device-id': Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

const validateDeviceUnEnrollment = {
  pathParameters: Joi.object()
    .keys({
      deviceId: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
  headers: Joi.object()
    .keys({
      'x-ud-device-id': Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

const validateInAppOTP = {
  body: Joi.object()
    .keys({
      inAppOtp: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
  headers: Joi.object()
    .keys({
      'x-ud-device-id': Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

const validateConfirmTrustedDevice = {
  headers: Joi.object()
    .keys({
      'x-ud-device-id': Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

module.exports = {
  validateDeviceEnrollment,
  validateDeviceEnrollmentConfirmation,
  validateDeviceEnrollmentToken,
  validateDeviceEnrollmentOtp,
  validateDeviceUnEnrollment,
  validateInAppOTP,
  validateConfirmTrustedDevice,
};
