const Joi = require('joi');

module.exports.validateSendSmsOtp = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
    flowId: Joi.string().required(),
    referenceId: Joi.string().required(),
    mobileNumber: Joi.string().required(),
  }),
};

module.exports.validateLogin = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

module.exports.validateValidateSmsOtp = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
    flowId: Joi.string().required(),
    otp: Joi.string().required(),
    otpId: Joi.string().required(),
  }),
};

module.exports.validategetUserProfile = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
};
