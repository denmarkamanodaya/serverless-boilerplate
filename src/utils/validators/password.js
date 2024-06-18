const Joi = require('joi');
module.exports.changePasswordSchema = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
      newPassword: Joi.string().required(),
      deviceId: Joi.string().optional(),
      sessionId: Joi.string().optional(),
    })
    .options({ allowUnknown: false }),
};

module.exports.requestResetPasswordSchema = {
  body: Joi.object()
    .keys({
      mobileNumber: Joi.string().required(),
      deviceId: Joi.string().optional(),
      sessionId: Joi.string().optional(),
    })
    .options({ allowUnknown: false }),
};

module.exports.resetPasswordSchema = {
  body: Joi.object()
    .keys({
      mobileNumber: Joi.string().required(),
      password: Joi.string().required(),
      token: Joi.string().required().trim(),
      otp: Joi.string().required(),
      deviceId: Joi.string().optional(),
      sessionId: Joi.string().optional(),
    })
    .options({ allowUnknown: false }),
};
