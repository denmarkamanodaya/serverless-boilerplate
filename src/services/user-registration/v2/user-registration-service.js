const { UserRegError } = require('../../../utils/custom-errors/class-errors');
const udUserOnboardingService = require('../../../services/ud-user-onboarding/user-onboarding-service');
const { httpResponseCodes, jwtResponseCodes } = require('../../../common/response-codes');
const { USER_REGISTRATION_CONFIG } = require('../../../common/constants');
const { otps, verifyNoBearer } = require('../../../services/mfa-service/v2/mfa-service');
const { getUser, migrateUser } = require('../../../utils/helpers/user-helper');
const { sign, verify } = require('../../../utils/helpers/jwt-helperv2');
const { ddbUserRegEntityv2 } = require('../../../utils/aws/dynamo-db');
const { mfaSuccessCodes } = require('../../../common/mfa-codes');
const moment = require('moment');
const httpStatus = require('http-status');

module.exports.userRegMobileVerification = async (data) => {
  const { countryCode, mobileNumber } = data;
  const fullMobileNumber = `${countryCode}${mobileNumber}`;
  const { status } = await udUserOnboardingService.verifyUser(mobileNumber);
  if (status === httpStatus.OK) {
    const payload = {
      username: fullMobileNumber,
      purpose: USER_REGISTRATION_CONFIG.MFA_PURPOSE,
      template: USER_REGISTRATION_CONFIG.TEMPLATE,
    };
    const user = await getUser({ username: fullMobileNumber });
    console.log('ASHBDJNKMALS<:D>: ', user);
    if (user) {
      throw new UserRegError(httpResponseCodes.USER_EXIST.value, httpResponseCodes.USER_EXIST.value, httpStatus.CONFLICT);
    }
    const token = await otps(payload);
    console.log(token);
    return { mfaToken: token };
  }
};

module.exports.userRegOtpVerification = async (data) => {
  const { otp, token, countryCode, mobileNumber } = data;
  const fullMobileNumber = `${countryCode}${mobileNumber}`;
  const response = await verifyNoBearer({ otp, token, mobileNumber: fullMobileNumber });

  if (response === mfaSuccessCodes.VERIFIED.value) {
    const res = await sign({ mobileNumber: fullMobileNumber });
    await ddbUserRegEntityv2.put({
      dataset: USER_REGISTRATION_CONFIG.DDB_DATASET_NAME,
      sort_key: res,
      otp,
      country_code: countryCode,
      mobile_number: fullMobileNumber,
      is_valid: true,
      created_at: moment().format(),
      updated_at: moment().format(),
    });
    return { oneTimeToken: res };
  }
};

module.exports.userRegUserCreation = async (data) => {
  const { oneTimeToken, username, password } = data;
  const { Item } = await ddbUserRegEntityv2.get({
    dataset: USER_REGISTRATION_CONFIG.DDB_DATASET_NAME,
    sort_key: oneTimeToken,
  });

  if (!Item || !Item.is_valid) {
    throw new UserRegError(jwtResponseCodes.JWT_INVALID.value, jwtResponseCodes.JWT_INVALID.value, httpStatus.UNAUTHORIZED);
  }

  const user = await getUser({ username });
  if (user) {
    throw new UserRegError(httpResponseCodes.USER_EXIST.value, httpResponseCodes.USER_EXIST.value, httpStatus.CONFLICT);
  }

  const response = await verify(oneTimeToken);
  if (response) {
    Promise.all([
      ddbUserRegEntityv2.update({
        dataset: USER_REGISTRATION_CONFIG.DDB_DATASET_NAME,
        sort_key: oneTimeToken,
        is_valid: false,
        updated_at: moment().format(),
      }),
      migrateUser({ username, password }),
    ]);

    return { message: httpResponseCodes.USER_SUCCESSFULLY_REGISTERED.value };
  }
};
