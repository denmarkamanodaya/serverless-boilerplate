const Joi = require('joi');

const validateMfaOtps = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    template: Joi.string().required(),
    purpose: Joi.string().required(),
    data: Joi.object().optional(),
  }),
};

const validateMfaOtpVerification = {
  body: Joi.object().keys({
    otp: Joi.string().required(),
    token: Joi.string().required(),
  }),
};

module.exports = {
  validateMfaOtps,
  validateMfaOtpVerification,
};
