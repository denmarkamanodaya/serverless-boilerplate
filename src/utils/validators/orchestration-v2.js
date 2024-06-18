const Joi = require('joi');

module.exports.trustTheDeviceSchema = {
  body: Joi.object({
    deviceId: Joi.string().required().trim(),
  }).unknown(),
};

module.exports.unTrustTheDeviceSchema = {
  body: Joi.object({
    deviceId: Joi.string().required().trim(),
  }).unknown(),
};

module.exports.validateSmsOtp = {
  body: Joi.object({
    otp: Joi.string().required().trim(),
    otpId: Joi.string().required().trim(),
  }).unknown(),
};

module.exports.generateAccessCode = {
  body: Joi.object({
    version: Joi.string().required().trim(),
    kosmosDid: Joi.string().required().trim(),
  }).unknown(),
};
