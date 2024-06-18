const { MFA_OTP_CONFIG } = require('../../common/constants');

module.exports.OTP_GENERATOR_MFA_CONFIG = {
  length: MFA_OTP_CONFIG.OTP_LENGTH,
  chars: MFA_OTP_CONFIG.OTP_CHARS_NUMERIC,
};
