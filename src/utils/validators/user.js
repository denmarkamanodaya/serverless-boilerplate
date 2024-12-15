const Joi = require('joi');

module.exports.validateUserSchema = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};
