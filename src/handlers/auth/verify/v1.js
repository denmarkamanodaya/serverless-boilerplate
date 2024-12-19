const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { httpResponseCodes, auth0ResponseCodes } = require('../../../common/response-codes');
const { AUTH0_TENANT } = require('../../../common/constants');
const { createRemoteJWKSet, jwtVerify } = require('jose');
const httpStatus = require('http-status');

module.exports.handler = middleware(async ({ headers, body }) => {
  const { access_token } = body;
  const JWKS = createRemoteJWKSet(new URL(`${AUTH0_TENANT.JWKS_URL}`));

  try {
    await jwtVerify(access_token, JWKS, {
      issuer: `${AUTH0_TENANT.DOMAIN}/`,
      audience: `${AUTH0_TENANT.AUDIENCE}`,
    });

    return {
      status: httpStatus.OK,
      code: auth0ResponseCodes.TOKEN_VERIFIED.value
    };
  } catch (error) {
    return {
      status: httpStatus.UNAUTHORIZED,
      code: auth0ResponseCodes.TOKEN_INVALID.value
    };
  }
});
