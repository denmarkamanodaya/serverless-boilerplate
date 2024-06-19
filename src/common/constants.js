const secrets = require('config-dug').default;

const HEADER_AUTH = {
  CONTENT_TYPE: 'content-type',
  ACCEPT: 'application/json',
  CHARSET: 'utf-8',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
};

const REGULAR_EXPRESSION = {
  REMOVE_SPACE: /\s+/g,
  CHECK_NUMBER: /^\d+$/,
  VALID_NAME: /^[ña-z\d\s]+$/i,
};

const JWT_CONFIG = {
  KMS_KEY: secrets.ASYMMETRIC_KMS_KEY,
  ALGO: 'RSASSA_PKCS1_V1_5_SHA_256',
  MESSAGE_TYPE: 'RAW',
  HEADER_ALG: 'RS256',
  HEADER_TYP: 'jWT',
  TOKEN_DURATION: 1800,
  TIME_FORMAT: 'seconds',
};

module.exports = {
  HEADER_AUTH,
  REGULAR_EXPRESSION,
  JWT_CONFIG,
};
