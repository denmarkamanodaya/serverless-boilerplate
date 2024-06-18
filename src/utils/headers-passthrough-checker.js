const { httpResponseCodes } = require('../utils/response-codes');
const httpStatus = require('http-status');
const { IamError } = require('../utils/custom-errors/class-errors');
module.exports.accessTokenCheck = (headers) => {
  if (!headers.authorization || typeof headers != 'object') {
    const message = httpResponseCodes.HEADERS_CANNOT_BE_PARSED.value;

    throw new IamError(message, httpResponseCodes.HEADERS_CANNOT_BE_PARSED.value, httpStatus.INTERNAL_SERVER_ERROR);
  }
  const getHeaderToken = headers.authorization.split(' ');
  return getHeaderToken[1];
};
