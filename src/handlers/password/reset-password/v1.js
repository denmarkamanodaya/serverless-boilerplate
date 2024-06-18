const { getUser } = require('../../../utils/helpers/user-helper');
const { validatePasswordCriteria, validatePassword } = require('../../../utils/helpers/password-helper');
const { mfaSuccessCodes } = require('../../../common/mfa-codes');
const { verifyNoBearer } = require('../../../services/mfa-service/v2/mfa-service');
const { IamError } = require('../../../utils/custom-errors/class-errors');
const { httpResponseCodes, authServiceResponseCodes } = require('../../../utils/response-codes');
const logger = require('../../../utils/helpers/logger');
const httpStatus = require('http-status');
const { defaultMiddleware: middleware } = require('../../../middlewares/middy');
const { resetPasswordSchema } = require('../../../utils/validators/password');
const { updateUserPassword } = require('../../../utils/helpers/password-helper');

module.exports.handler = middleware(async (data) => {
  const { mobileNumber: username, password, token, otp } = data.body;
  const isValid = validatePasswordCriteria({ password });

  if (!isValid) {
    throw new IamError(
      httpResponseCodes.PASSWORD_CRITERIA_DOES_NOT_MATCH.value,
      httpResponseCodes.PASSWORD_CRITERIA_DOES_NOT_MATCH.value,
      httpStatus.BAD_REQUEST
    );
  }

  // TODO: future features
  // get 3 consecutive previous password
  // check 3 consecutive previous password if match in new password
  // if yes return error

  const user = await getUser({ username });
  if (!user) {
    throw new IamError(
      httpResponseCodes.USER_DOES_NOT_EXIST.value,
      httpResponseCodes.USER_DOES_NOT_EXIST.value,
      httpStatus.BAD_REQUEST
    );
  }
  // should throw error if invalid
  const responseNoBearer = await verifyNoBearer({ otp, token, mobileNumber: username });
  logger.info(`verifyNoBearer | ${JSON.stringify({ responseNoBearer })}`);
  // check if password or salt exist then do validate password
  if (user.password || user.salt) {
    const userPwdData = { actualPasswordHash: user.password, salt: user.salt, inputRawPassword: password };
    if (validatePassword(userPwdData)) {
      throw new IamError(
        httpResponseCodes.PASSWORD_CANNOT_BE_SAME.value,
        httpResponseCodes.PASSWORD_CANNOT_BE_SAME.value,
        httpStatus.BAD_REQUEST
      );
    }
  }

  try {
    await updateUserPassword({ username, newPassword: password });
    return {
      code: httpResponseCodes.PASSWORD_RESET.value,
      data: { message: authServiceResponseCodes.PASSWORD_UPDATED.value },
    };
  } catch (error) {
    throw new IamError(
      httpResponseCodes.DATA_PROCESSING_ERROR.value,
      httpResponseCodes.DATA_PROCESSING_ERROR.value,
      httpStatus.BAD_REQUEST
    );
  }
}, resetPasswordSchema);
