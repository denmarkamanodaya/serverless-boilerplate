const Joi = require('joi');

const validateSendSmsOtp = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
    flowId: Joi.string().required(),
    referenceId: Joi.string().required(),
    mobileNumber: Joi.string().required(),
  }),
};

const validateLogin = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const validateValidateSmsOtp = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
    flowId: Joi.string().required(),
    otp: Joi.string().required(),
    otpId: Joi.string().required(),
  }),
};

const validategetUserProfile = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

module.exports = {
  validateSendSmsOtp,
  validateLogin,
  validateValidateSmsOtp,
  validategetUserProfile,
};
