const Joi = require('joi');

const validateValidateSmsOtpFlow = {
  body: Joi.object().keys({
    otp: Joi.string().required(),
    otpId: Joi.string().required(),
  }),
};

const validateGenerateAccessCodeFlow = {
  body: Joi.object().keys({
    kosmosDid: Joi.string().required(),
    version: Joi.string().required(),
  }),
};

const validateTrustDeviceFlow = {
  body: Joi.object().keys({
    deviceId: Joi.string().required(),
  }),
};

const flowIdArray = [
  'generate-sms-otp',
  'validate-sms-otp',
  'generate-access-code',
  'trust-the-device',
  'disable-trusted-device',
];
const validateFlowId = {
  params: Joi.object({
    flowId: Joi.string()
      .valid(...flowIdArray)
      .required(),
  }).unknown(false),
};

module.exports = {
  validateValidateSmsOtpFlow,
  validateGenerateAccessCodeFlow,
  validateTrustDeviceFlow,
  validateFlowId,
};
