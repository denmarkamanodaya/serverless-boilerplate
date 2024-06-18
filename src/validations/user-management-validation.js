const Joi = require('joi');

const validateVerifyOtp = {
  body: Joi.object().keys({
    code: Joi.string().required(),
    userId: Joi.string().required(),
  }),
};

const validateLogin = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

const validateLoginV2 = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
      deviceId: Joi.string().required(),
      // sessionId: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

const validateSetUserStatus = {
  pathParameters: Joi.object()
    .keys({
      customerId: Joi.string().required(),
      status: Joi.string().valid('revoke', 'enable').required(),
    })
    .options({ allowUnknown: false }),
};

const validateLoginOtp = {
  body: Joi.object()
    .keys({
      mfaToken: Joi.string().required(),
      otp: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

const validateGenerate1KSmsOtp = {
  body: Joi.object()
    .keys({
      userId: Joi.string().required(),
      smsTo: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

const validateCreateUser = {
  body: Joi.object()
    .keys({
      mobileNumber: Joi.string().required(),
      membershipId: Joi.string().required(),
      password: Joi.string().required(),
    })
    .options({ allowUnknown: true }),
};

const validatePasswordReset = {
  body: Joi.object()
    .keys({
      mobileNumber: Joi.string().required(),
      password: Joi.string().required(),
      otp: Joi.string().required(),
      token: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

const validateChangePassword = {
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

const requestPasswordReset = {
  body: Joi.object()
    .keys({
      mobileNumber: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

const validateUpdateMembership = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      customerId: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

const validateCreateUserV2 = {
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      membershipId: Joi.string().optional(),
    })
    .options({ allowUnknown: false }),
};

const validateLogout = {
  body: Joi.object()
    .keys({
      token: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

const validateGetUserStatus = {
  pathParameters: Joi.object()
    .keys({
      username: Joi.string().required(),
    })
    .options({ allowUnknown: false }),
};

const validateLoginV6 = {
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

module.exports = {
  validateVerifyOtp,
  validateGenerate1KSmsOtp,
  validateCreateUser,
  validateLogin,
  validateLoginOtp,
  validateLoginV2,
  validateLoginV6,
  validatePasswordReset,
  requestPasswordReset,
  validateChangePassword,
  validateUpdateMembership,
  validateCreateUserV2,
  validateLogout,
  validateSetUserStatus,
  validateGetUserStatus,
};
