const udUserOnboardingService = require('../../services/ud-user-onboarding/user-onboarding-service');
const { getUser } = require('../../utils/helpers/user-helper');
const { validatePasswordCriteria, generatePasswordHash, generateSalt } = require('../../utils/helpers/password-helper');
const { Users } = require('../../models/index');
const { purposeCode, mfaTemplate, mfaSuccessCodes } = require('../../common/mfa-codes');
const { otps, verifyNoBearer } = require('../../services/mfa-service/v2/mfa-service');
const { IamError } = require('../../utils/custom-errors/class-errors');
const { httpResponseCodes, authServiceResponseCodes } = require('../../utils/response-codes');
const { send } = require('../../services/fraud-monitoring-service/fraud-monitoring-service');
const logger = require('./../../utils/helpers/logger');
const httpStatus = require('http-status');

module.exports.requestPasswordReset = async ({ body, headers }) => {
  const { mobileNumber } = body;
  const username = mobileNumber;
  const ip = headers['x-original-forwarded-for'] || '';

  try {
    const res = await udUserOnboardingService.getCustomerByMobile(username);
    const result = await getUser({ username });

    // Fraud Monitoring Integration
    if (res.status === httpStatus.OK && res.data.cid) {
      body.tmxEventType = 'details_change';
      send({
        ...headers,
        ...body,
        ip, //
        id: res.data.id,
      });
    }

    if (res.status === httpStatus.OK) {
      Users.findOrCreate({
        where: {
          username,
        },
        defaults: {
          membershipId: res.data.id,
          createdBy: res.data.id,
        },
      });
    }

    if (result || res.status === httpStatus.OK) {
      const token = await otps({
        username,
        purpose: purposeCode.MOBILE_NO_VERIFICATION.value,
        template: mfaTemplate.RESET_PASSWORD_OTP.value,
      });

      return { token };
    }
  } catch (e) {
    throw new IamError(e.message, httpResponseCodes.DATA_PROCESSING_ERROR.value, httpStatus.INTERNAL_SERVER_ERROR);
  }
};

module.exports.passwordReset = async (data) => {
  const { mobileNumber, password, token, otp } = data;
  const isValid = await validatePasswordCriteria({ password });

  try {
    if (!isValid) {
      throw new IamError(
        httpResponseCodes.PASSWORD_CRITERIA_DOES_NOT_MATCH.value,
        httpResponseCodes.PASSWORD_CRITERIA_DOES_NOT_MATCH.value,
        httpStatus.BAD_REQUEST
      );
    }

    const user = await getUser({ username: mobileNumber });
    const response = await verifyNoBearer({ otp, token, mobileNumber });
    console.log('ASIDJNKAMSDASBHJDNMADHBAJD:', response);

    if (response === mfaSuccessCodes.VERIFIED.value && user) {
      const userPasswordHash = user.password;
      const salt = user.salt;

      const nominatedPasswordHash = await generatePasswordHash({ salt, password });

      if (nominatedPasswordHash === userPasswordHash) {
        throw new IamError(
          httpResponseCodes.PASSWORD_CANNOT_BE_SAME.value,
          httpResponseCodes.PASSWORD_CANNOT_BE_SAME.value,
          httpStatus.BAD_REQUEST
        );
      }

      const generatedSalt = await generateSalt();
      const generatedPasswordHash = await generatePasswordHash({ salt: generatedSalt, password });

      Users.update(
        {
          salt: generatedSalt,
          password: generatedPasswordHash,
        },
        {
          where: { username: mobileNumber },
        }
      );

      return { message: authServiceResponseCodes.PASSWORD_UPDATED.value };
    }

    throw new IamError(
      httpResponseCodes.DATA_PROCESSING_ERROR.value,
      httpResponseCodes.DATA_PROCESSING_ERROR.value,
      httpStatus.BAD_REQUEST
    );
  } catch (e) {
    throw new IamError(e.message, e.code, e.statusCode);
  }
};

module.exports.changePassword = async ({ body, headers }) => {
  const { username, password, newPassword } = body;
  const isValid = await validatePasswordCriteria({ password: newPassword });

  try {
    if (!isValid) {
      throw new IamError(
        httpResponseCodes.PASSWORD_CRITERIA_DOES_NOT_MATCH.value,
        httpResponseCodes.PASSWORD_CRITERIA_DOES_NOT_MATCH.value,
        httpStatus.BAD_REQUEST
      );
    }

    // Login
    // const { baasToken: auth } = await login({body, headers});

    const user = await getUser({ username });
    const userPasswordHash = user.password;

    const nominatedPasswordHash = await generatePasswordHash({ salt: user.salt, password: newPassword });
    const currentPasswordToVerifyHash = await generatePasswordHash({ salt: user.salt, password });

    if (currentPasswordToVerifyHash !== userPasswordHash) {
      logger.info(`[change-password] | ${JSON.stringify({ username, password })}`);
      throw new IamError(
        authServiceResponseCodes.PASSWORD_DO_NOT_MATCH.value,
        authServiceResponseCodes.PASSWORD_DO_NOT_MATCH.value,
        httpStatus.BAD_REQUEST
      );
    }

    if (nominatedPasswordHash === userPasswordHash) {
      throw new IamError(
        httpResponseCodes.PASSWORD_CANNOT_BE_SAME.value,
        httpResponseCodes.PASSWORD_CANNOT_BE_SAME.value,
        httpStatus.BAD_REQUEST
      );
    }
  } catch (e) {
    throw new IamError(e.message, e.code, e.statusCode);
  }
};
