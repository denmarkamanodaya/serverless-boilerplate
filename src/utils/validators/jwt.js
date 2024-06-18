const Joi = require('joi');

module.exports.validateJwtVerification = {
  body: Joi.object()
    .keys({
      token: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

module.exports.validateSessionRecovation = {
  body: Joi.object()
    .keys({
      token: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};
