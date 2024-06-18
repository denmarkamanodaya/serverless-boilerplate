const Joi = require('joi');

module.exports.validateUserRegMobileVerification = {
  body: Joi.object()
    .keys({
      countryCode: Joi.string().valid('63').required(),
      mobileNumber: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

module.exports.userRegOtpVerification = {
  body: Joi.object()
    .keys({
      countryCode: Joi.string().required(),
      mobileNumber: Joi.string().required(),
      otp: Joi.string().required(),
      token: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

module.exports.validateUserRegUserCreation = {
  body: Joi.object()
    .keys({
      countryCode: Joi.string().required(),
      mobileNumber: Joi.string().required(),
      username: Joi.string().required(),
      password: Joi.string().required(),
      oneTimeToken: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};
