const Joi = require('joi');

module.exports.accessTokenSchema = {
  body: Joi.object({
    token: Joi.string().required().trim(),
  }),
};
