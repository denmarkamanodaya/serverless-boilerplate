const Joi = require('joi');

module.exports.validateValidateSmsOtpFlow = {
  body: Joi.object().keys({
    otp: Joi.string().required(),
    otpId: Joi.string().required(),
  }),
};

module.exports.validateGenerateAccessCodeFlow = {
  body: Joi.object().keys({
    kosmosDid: Joi.string().required(),
    version: Joi.string().required(),
  }),
};

module.exports.validateTrustDeviceFlow = {
  body: Joi.object().keys({
    deviceId: Joi.string().required(),
  }),
};

module.exports.flowIdArray = [
  'generate-sms-otp',
  'validate-sms-otp',
  'generate-access-code',
  'trust-the-device',
  'disable-trusted-device',
];

module.exports.validateFlowId = {
  params: Joi.object({
    flowId: Joi.string()
      .valid(...flowIdArray)
      .required(),
  }).unknown(false),
};
