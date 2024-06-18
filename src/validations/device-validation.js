const Joi = require('joi');

const validateCheckUserDevice = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const validateTrustUntrustDevice = {};

const validateCheckIfDeviceExists = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    deviceId: Joi.string().required(),
  }),
};

const validateAddDevice = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    deviceId: Joi.string().required(),
  }),
};

const validateEnableInAppOtp = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    deviceId: Joi.string().required(),
    makeModel: Joi.string().required(),
  }),
};

const validateCheckIfDeviceIsTrusted = {
  body: Joi.object()
    .keys({
      userId: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

module.exports = {
  validateTrustUntrustDevice,
  validateCheckUserDevice,
  validateEnableInAppOtp,
  validateAddDevice,
  validateCheckIfDeviceExists,
  validateCheckIfDeviceIsTrusted,
};
