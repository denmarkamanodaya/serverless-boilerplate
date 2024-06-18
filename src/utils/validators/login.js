const Joi = require('joi');

module.exports.validateLoginV6 = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
  headers: Joi.object()
    .keys({
      'x-ud-device-id': Joi.string().required(),
      'x-ud-device-make-model': Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

module.exports.validateLoginV2 = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
      deviceId: Joi.string().required(),
      sessionId: Joi.string().optional(),
    })
    .options({ allowUnknown: false }),
};
