const { getUser } = require('../../../utils/helpers/user-helper');
const { validatePasswordCriteria, validatePassword } = require('../../../utils/helpers/password-helper');
const { IamError } = require('../../../utils/custom-errors/class-errors');
const { httpResponseCodes, authServiceResponseCodes } = require('../../../utils/response-codes');
const httpStatus = require('http-status');
const { updateUserPassword } = require('../../../utils/helpers/password-helper');
const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { changePasswordSchema } = require('../../../utils/validators/password');
const logger = require('../../../utils/logger');

module.exports.handler = middleware(async ({ body }) => {
  const { username, password, newPassword } = body;

  // get user data
  const user = await getUser({ username });
  if (!user) {
    throw new IamError(
      httpResponseCodes.USER_DOES_NOT_EXIST.value,
      httpResponseCodes.USER_DOES_NOT_EXIST.value,
      httpStatus.BAD_REQUEST
    );
  }
  const userPasswordHash = user.password;
  const userPwdData = { username, salt: user.salt, inputRawPassword: password, actualPasswordHash: userPasswordHash };
  if (!validatePassword(userPwdData)) {
    logger.info(`change-password | password in payload does not match in saved current password`);
    throw new IamError(
      authServiceResponseCodes.PASSWORD_DO_NOT_MATCH.value,
      authServiceResponseCodes.PASSWORD_DO_NOT_MATCH.value,
      httpStatus.BAD_REQUEST
    );
  }

  // initial validation for new password
  if (password === newPassword) {
    logger.info(`change-password | new password in payload must not equal to saved current password`);
    throw new IamError(
      httpResponseCodes.PASSWORD_CANNOT_BE_SAME.value,
      httpResponseCodes.PASSWORD_CANNOT_BE_SAME.value,
      httpStatus.BAD_REQUEST
    );
  }
  // TODO: future features
  // get 3 consecutive previous password
  // check 3 consecutive previous password if match in new password
  // if yes return error

  // check if new password is valid in criteria
  const isValid = validatePasswordCriteria({ password: newPassword });
  if (!isValid) {
    throw new IamError(
      httpResponseCodes.PASSWORD_CRITERIA_DOES_NOT_MATCH.value,
      httpResponseCodes.PASSWORD_CRITERIA_DOES_NOT_MATCH.value,
      httpStatus.BAD_REQUEST
    );
  }

  try {
    await updateUserPassword({ username, newPassword });
    return { code: httpResponseCodes.PASSWORD_CHANGE.value, data: { message: httpResponseCodes.PASSWORD_CHANGE.value } };
  } catch (error) {
    throw new IamError(
      httpResponseCodes.DATA_PROCESSING_ERROR.value,
      httpResponseCodes.DATA_PROCESSING_ERROR.value,
      httpStatus.BAD_REQUEST
    );
  }
}, changePasswordSchema);
