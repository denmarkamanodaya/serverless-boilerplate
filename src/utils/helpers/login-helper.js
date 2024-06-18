const { IamError } = require('../../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../../common/response-codes');
const { generatePasswordHash } = require('./password-helper');

module.exports.validatePassword = ({ salt, inputPassword, existingPasswordHash }) => {
  const inputPasswordHash = generatePasswordHash({
    salt,
    password: inputPassword,
  });
  return inputPasswordHash === existingPasswordHash;
};

module.exports.throwGenericError = (statusCode) => {
  throw new IamError(httpResponseCodes.ERROR_PROCESSING.value, httpResponseCodes.ERROR_PROCESSING.value, statusCode);
};

module.exports.throwCustomError = ({ message, code, status }) => {
  throw new IamError(message, code, status);
};
