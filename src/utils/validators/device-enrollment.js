const Joi = require('joi');

module.exports.validateDeviceEnrollment = {
  headers: Joi.object()
    .keys({
      'x-ud-device-make-model': Joi.string().required(),
      'x-ud-device-id': Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

module.exports.validateDeviceEnrollmentToken = {
  headers: Joi.object()
    .keys({
      'x-device-enrollment-token': Joi.string().required(),
      'x-ud-device-id': Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

module.exports.validateDeviceEnrollmentOtp = {
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

module.exports.validateDeviceEnrollmentConfirmation = {
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

module.exports.validateDeviceUnEnrollment = {
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

module.exports.validateInAppOTP = {
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

module.exports.validateConfirmTrustedDevice = {
  headers: Joi.object()
    .keys({
      'x-ud-device-id': Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};
