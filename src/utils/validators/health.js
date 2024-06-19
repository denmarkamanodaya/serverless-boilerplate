const Joi = require('joi');

module.exports.healthSchema = {
  headers: Joi.object({
    authorization: Joi.string().required().trim(),
  }).unknown(),
};
