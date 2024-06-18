const httpStatus = require('http-status');
const { verify, decode } = require('../utils/helpers/jwt-helperv2');
const { jwtResponseCodes } = require('../common/response-codes');
const { JWTError } = require('../utils/custom-errors/class-errors');

module.exports = (header) => {
  const pickToken = (token) => (token.length === 2 ? token[1] : token[0]);

  return {
    before: async ({ event }) => {
      if (!header) return;

      const { headers } = event;
      const token = headers[header].split(' ');
      const isValid = await verify(pickToken(token));

      if (!isValid) throw new JWTError(jwtResponseCodes.JWT_INVALID, jwtResponseCodes.JWT_INVALID, httpStatus.UNAUTHORIZED);

      event.decodedToken = decode(pickToken(token));
      event.rawToken = pickToken(token);
    },
  };
};
