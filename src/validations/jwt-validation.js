const Joi = require('joi');

const validateJwtVerification = {
  body: Joi.object()
    .keys({
      token: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

const validateSessionRecovation = {
  body: Joi.object()
    .keys({
      token: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

module.exports = {
  validateJwtVerification,
  validateSessionRecovation,
};
