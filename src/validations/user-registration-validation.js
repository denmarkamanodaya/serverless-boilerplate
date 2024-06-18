const Joi = require('joi');

const validateUserRegMobileVerification = {
  body: Joi.object()
    .keys({
      countryCode: Joi.string().valid('63').required(),
      mobileNumber: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

const userRegOtpVerification = {
  body: Joi.object()
    .keys({
      countryCode: Joi.string().required(),
      mobileNumber: Joi.string().required(),
      otp: Joi.string().required(),
      token: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

const validateUserRegUserCreation = {
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

module.exports = {
  validateUserRegMobileVerification,
  userRegOtpVerification,
  validateUserRegUserCreation,
};
