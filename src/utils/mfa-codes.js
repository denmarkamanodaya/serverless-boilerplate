const Enum = require('enum');

module.exports.purposeCode = new Enum({
  MOBILE_NO_VERIFICATION: 'MOBILE_NO_VERIFICATION',
  BILLS_PAYMENT: 'BILLS_PAYMENT',
  TRANSFERS: 'TRANSFERS',
  CASH_IN: 'CASH_IN',
  CASH_OUT: 'CASH_OUT',
  CARD_MANAGEMENT: 'CARD_MANAGEMENT',
  TIME_DEPOSIT: 'TIME_DEPOSIT',
  USER_REGISTRATION: 'USER_REGISTRATION',
  LENDING: 'LENDING',
});

module.exports.purposeSmsTemplate = new Enum({
  LOGIN: 'onboarding-login-authentication-otp',
});

module.exports.mfaSuccessCodesmfaErrorCodes = new Enum({
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  OTP_ON_COOLDOWN: 'OTP_ON_COOLDOWN',
  HARD_LOCKED: 'HARD_LOCKED',
  SOFT_LOCK: 'SOFT_LOCK',
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_USED: 'OTP_USED',
  PURPOSE_DOES_NOT_EXIST: 'PURPOSE_DOES_NOT_EXIST',
  INVALID_MOBILE_NUMBER: 'INVALID_MOBILE_NUMBER',
  OTP_LENGTH: 'OTP_LENGTH',
});

module.exports.mfaSuccessCodes = new Enum({
  VERIFIED: 'VERIFIED',
});

module.exports.mfaTemplate = new Enum({
  RESET_PASSWORD_OTP: 'iam-forgot-password-otp',
});
