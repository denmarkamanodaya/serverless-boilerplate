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
  REPLACE_HYPEN: /-/g,
};

const AUTH0_TENANT = {
  DOMAIN: secrets.AUTH0_DOMAIN,
  CLIENT_ID: secrets.AUTH0_CLIENT_ID,
  CLIENT_SECRET: secrets.AUTH0_CLIENT_SECRET,
  JWKS_URL: secrets.AUTH0_JWKS_URL,
  AUDIENCE: secrets.AUTH0_AUDIENCE,
}

const AUTH0_XPLOR_OFFICE_APP = {
  CLIENT_ID: secrets.AUTH0_XPLOR_OFFICE_APP_CLIENT_ID,
  CLIENT_SECRET: secrets.AUTH0_XPLOR_OFFICE_APP_CLIENT_SECRET,
}

module.exports = {
  HEADER_AUTH,
  REGULAR_EXPRESSION,
  AUTH0_TENANT,
  AUTH0_XPLOR_OFFICE_APP
};
