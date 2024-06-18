const Joi = require('joi');

module.exports.validateVerifyOtp = {
  body: Joi.object().keys({
    code: Joi.string().required(),
    userId: Joi.string().required(),
  }),
};

module.exports.validateLogin = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

module.exports.validateLoginV2 = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
      deviceId: Joi.string().required(),
      // sessionId: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

module.exports.validateSetUserStatus = {
  pathParameters: Joi.object()
    .keys({
      customerId: Joi.string().required(),
      status: Joi.string().valid('revoke', 'enable').required(),
    })
    .options({ allowUnknown: false }),
};

module.exports.validateLoginOtp = {
  body: Joi.object()
    .keys({
      mfaToken: Joi.string().required(),
      otp: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

module.exports.validateGenerate1KSmsOtp = {
  body: Joi.object()
    .keys({
      userId: Joi.string().required(),
      smsTo: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

module.exports.validateCreateUser = {
  body: Joi.object()
    .keys({
      mobileNumber: Joi.string().required(),
      membershipId: Joi.string().required(),
      password: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

module.exports.validatePasswordReset = {
  body: Joi.object()
    .keys({
      mobileNumber: Joi.string().required(),
      password: Joi.string().required(),
      otp: Joi.string().required(),
      token: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

module.exports.validateChangePassword = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
      newPassword: Joi.string().required(),
      sessionId: Joi.string().required(),
      deviceId: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

module.exports.validateRequestPasswordReset = {
  body: Joi.object()
    .keys({
      mobileNumber: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

module.exports.validateUpdateMembership = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      customerId: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

module.exports.validateCreateUserV2 = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      membershipId: Joi.string().optional(),
    })
    .options({ allowUnknown: false }),
};

module.exports.validateLogout = {
  body: Joi.object()
    .keys({
      token: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

module.exports.validateGetUserStatus = {
  pathParameters: Joi.object()
    .keys({
      username: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

module.exports.validateLoginV6 = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
  headers: Joi.object()
    .keys({
      'x-ud-device-id': Joi.string().required(),
      'x-ud-device-make-model': Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};
