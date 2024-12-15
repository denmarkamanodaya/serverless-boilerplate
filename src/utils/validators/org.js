const Joi = require('joi');

module.exports.validateOrgSchema = {
  body: Joi.object()
    .keys({
      name: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

module.exports.validateOrgsSchema = {
  body: Joi.object()
    .keys({
      organizations: Joi.array().items().required(),
    })
    .options({ allowUnknown: false }),
};