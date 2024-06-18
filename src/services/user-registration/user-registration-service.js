const { UserRegError } = require('../../utils/custom-errors/class-errors');
const httpStatus = require('http-status');
const { httpResponseCodes } = require('../../utils/response-codes');

const { Users } = require('../../models/index');

const logger = require('../../utils/logger');

const { USER_REGISTRATION_CONFIG } = require('../../common/constants');

const udUserOnboardingService = require('../ud-user-onboarding/user-onboarding-service');

const { MfaService } = require('../mfa-service');
const mfa = new MfaService();

const { mfaSuccessCodes } = require('../../utils/mfa-codes');

const { UserManagementService } = require('../user-management-service');
const ums = new UserManagementService();

const { JWT } = require('../jwt-service');
const jwt = new JWT();

const { Wso2UserMigrationService } = require('../wso2-user-migration-service');
const wums = new Wso2UserMigrationService();

class UserRegistrationService {
  async userRegMobileVerification(body) {
    try {
      const mobileNumber = [body.countryCode, body.mobileNumber].join('');

      // Perform dedupe > if account is valid > generate OTP > store to DDB > create user
      const { data, status } = await udUserOnboardingService.verifyUser(mobileNumber);

      logger.info(
        `[user-registration-mobile-verification] 
        | ${mobileNumber} 
        | ${JSON.stringify(data)}
        )}`
      );

      if (status == httpStatus.OK) {
        // Generate OTP x DDB store

        // For update
        const payload = {
          username: mobileNumber,
          purpose: USER_REGISTRATION_CONFIG.MFA_PURPOSE,
          template: USER_REGISTRATION_CONFIG.TEMPLATE,
        };

        const token = await mfa.otps(payload);

        const rec = await Users.findOne({
          where: {
            username: mobileNumber,
          },
        });

        // Return error if user detail is complete,
        // else continue for mobile# verification
        if (!Object.is(rec, null) && !Object.is(rec.password, null)) {
          return await this._error({
            message: httpResponseCodes.USER_EXIST.value,
            responseCode: httpResponseCodes.USER_EXIST.value,
            statusCode: httpStatus.CONFLICT,
          });
        }

        return { mfaToken: token };
      }
    } catch (error) {
      return await this._error(error);
    }
  }

  async userRegOtpVerification(body) {
    try {
      const { otp, token, countryCode, mobileNumber } = body;
      const fullMobileNumber = [countryCode, mobileNumber].join('');

      const response = await mfa.verify({
        otp,
        token,

        // Implement mobile# for sort_key requirements
        mobileNumber: fullMobileNumber,
      });

      logger.info(
        `[user-registration-verify-otp]
        | ${fullMobileNumber}
        | ${JSON.stringify(response)}`
      );

      // if verified > get auth-service user data > generate JWT oneTimeToken
      if (response == mfaSuccessCodes.VERIFIED.value) {
        const res = await jwt.sign({
          mobileNumber: fullMobileNumber,
        });

        return { oneTimeToken: res };
      }
    } catch (error) {
      return await this._error(error);
    }
  }

  async userRegUserCreation(body) {
    try {
      const { password, username, oneTimeToken } = body;

      // validate oneTimeToken > validate password criteria
      // > generate salt and password
      // > invalidate oneTimeToken

      // auto-return error no handling needed
      await Promise.all([jwt.verify({ token: oneTimeToken }), ums.validatePasswordCriteria(password)]);

      // Use current User Creation for third-party creation as well
      // We'll just update the salt x password after.
      // const record = await ums.createUserV2({ username });

      // Thou shall not update existing user's password
      // additional validation layer but not needed as
      // conflict error will be returned from the main function

      // Create initial user
      const [user, created] = await Users.findOrCreate({
        where: {
          username: username,
          membershipId: null,
        },
      });

      if (!created) {
        return await this._error({
          message: httpResponseCodes.USER_EXIST.value,
          responseCode: httpResponseCodes.USER_EXIST.value,
          statusCode: httpStatus.CONFLICT,
        });
      }

      await wums.changePassword({ username, password });

      logger.info(
        `[user-registration-user-creation]
          | ${username}
          | Password created.`
      );

      // oneTimeToken revocation
      await jwt.sessionRevocation({ token: oneTimeToken });

      return {
        message: httpResponseCodes.USER_SUCCESSFULLY_REGISTERED.value,
      };
    } catch (error) {
      return await this._error(error);
    }
  }

  async _error(error) {
    throw new UserRegError(
      error?.message,
      error?.responseCode ? error.responseCode : error?.code ? error.code : httpResponseCodes.DATA_PROCESSING_ERROR.value,
      error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

module.exports = { UserRegistrationService };
