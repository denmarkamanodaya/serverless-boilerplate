const Joi = require('joi');

module.exports.sendOTPSchema = {
  headers: Joi.object({
    authorization: Joi.string().required().trim(),
  }).unknown(),

  body: Joi.object({
    username: Joi.string().required().trim(),
    template: Joi.string().required().trim(),
    purpose: Joi.string().required().trim(),
  }),
};

module.exports.verifySchema = {
  headers: Joi.object({
    authorization: Joi.string().required().trim(),
  }).unknown(),

  body: Joi.object({
    otp: Joi.string().required().trim(),
    token: Joi.string().required().trim(),
  }),
};
