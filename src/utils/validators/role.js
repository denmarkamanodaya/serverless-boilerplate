const Joi = require('joi');

module.exports.validateRoleSchema = {
  body: Joi.object()
    .keys({
      name: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};
