//reference for old device validation
const Joi = require('joi');

module.exports.validateCheckUserDevice = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

module.exports.validateCheckIfDeviceExists = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    deviceId: Joi.string().required(),
  }),
};

module.exports.validateAddDevice = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    deviceId: Joi.string().required(),
  }),
};

module.exports.validateEnableInAppOtp = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    deviceId: Joi.string().required(),
    makeModel: Joi.string().required(),
  }),
};

module.exports.validateCheckIfDeviceIsTrusted = {
  body: Joi.object()
    .keys({
      userId: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};
