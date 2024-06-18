const Joi = require('joi');

module.exports.initiateEnrollmentSchema = {
  headers: Joi.object({
    authorization: Joi.string().required().trim(),
  }).unknown(),
};

module.exports.confirmEnrollmentSchema = {
  headers: Joi.object({
    authorization: Joi.string().required().trim(),
    'x-device-confirmation-token': Joi.string().required().trim(),
  }).unknown(),
};

module.exports.initiateOTPChallengeSchema = {
  headers: Joi.object({
    authorization: Joi.string().required().trim(),
    'x-device-enrollment-token': Joi.string().required().trim(),
  }).options({ allowUnknown: true }),
};

module.exports.answerChallengeSchema = {
  headers: Joi.object({
    authorization: Joi.string().required().trim(),
    'x-device-enrollment-token': Joi.string().required().trim(),
  }).unknown(),

  body: Joi.object({
    otpId: Joi.string().required().trim(),
    otp: Joi.string().required().trim(),
  }),
};

module.exports.confirmTrustedDeviceSchema = {
  headers: Joi.object({
    authorization: Joi.string().required().trim(),
    'x-device-enrollment-token': Joi.string().required().trim(),
  }).unknown(),

  body: Joi.object({
    inAppOtp: Joi.string().required().trim(),
  }),
};

module.exports.untrustSchema = {
  pathParameters: Joi.object({ deviceId: Joi.string().required().trim() }),

  headers: Joi.object({
    authorization: Joi.string().required().trim(),
  }).unknown(),
};

module.exports.checkIfTrustedSchema = {
  headers: Joi.object({
    authorization: Joi.string().required().trim(),
  }).unknown(),
};

module.exports.totpValidateSchema = {
  headers: Joi.object({
    authorization: Joi.string().required().trim(),
    'x-ud-device-id': Joi.string().required().trim(),
  }).unknown(),

  body: Joi.object({
    inAppOtp: Joi.string().required().trim(),
  }),
};
