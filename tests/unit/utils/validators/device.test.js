const Joi = require('joi');
const {
  initiateEnrollmentSchema,
  confirmEnrollmentSchema,
  initiateOTPChallengeSchema,
  answerChallengeSchema,
  confirmTrustedDeviceSchema,
  untrustSchema,
  checkIfTrustedSchema,
  totpValidateSchema,
} = require('../../../../src/utils/validators/device');
const { JOI_VALIDATION_TEST_ERRORS } = require('../../../utils/constants/error-messages');
const { deviceParameters } = require('../../../fixtures/device-fixtures');

describe('Initiate Enrollment Schema', () => {
  let compileData;
  beforeEach(async () => {
    compileData = Joi.compile(initiateEnrollmentSchema.headers).prefs({ errors: { label: 'key' }, abortEarly: false });
  });
  afterEach(async () => {
    compileData = '';
  });
  test('Should validate missing authorization', async () => {
    const { error } = compileData.validate(deviceParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_AUTHORIZATION);
  });
  test('Should validate empty authorization', async () => {
    const { error } = compileData.validate(deviceParameters.emptyAuthorization);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.EMPTY_AUTHORIZATION);
  });
  test('Should validate integer authorization', async () => {
    const { error } = compileData.validate(deviceParameters.integerAuth);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.AUTHORIZATION_MUST_STRING);
  });
  test('Should validate authorization', async () => {
    const { error } = compileData.validate(deviceParameters.expectingAuthorization);
    expect(error).toBeUndefined();
  });
});

describe('Confirmation Enrollment Schema', () => {
  let confirmEnrollmentData;
  beforeEach(async () => {
    confirmEnrollmentData = Joi.compile(confirmEnrollmentSchema.headers).prefs({
      errors: { label: 'key' },
      abortEarly: false,
    });
  });
  afterEach(async () => {
    confirmEnrollmentData = '';
  });
  test('Should validate param headers', async () => {
    const { error } = confirmEnrollmentData.validate(deviceParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_CONFIRMATION_PARAMS);
  });
  test('Should validate no authorization params', async () => {
    const { error } = confirmEnrollmentData.validate(deviceParameters.missingParameterAuth);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_AUTHORIZATION);
  });
  test('Should validate no device confirmation token params', async () => {
    const { error } = confirmEnrollmentData.validate(deviceParameters.expectingAuthorization);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_CONFIRMATION_TOKEN);
  });
  test('Should validate empty auth and confirmation token', async () => {
    const { error } = confirmEnrollmentData.validate(deviceParameters.emptyBothAuthxConfirmationToken);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.EMPTY_AUTH_CONFIRMATION_TOKEN);
  });
  test('Should validate integer auth and confirmation token ', async () => {
    const { error } = confirmEnrollmentData.validate(deviceParameters.integerBothAuthorizationAndConfirmationToken);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.INTEGER_AUTH_AND_CONFIRMATION_TOKEN);
  });
  test('Should validate confirmation enrollment', async () => {
    const { error } = confirmEnrollmentData.validate(deviceParameters.expectAuthandConfirmationToken);
    expect(error).toBeUndefined();
  });
});

describe('Initiate OTP Challenge Schema', () => {
  let initiateOtpChallengeData;
  beforeEach(async () => {
    initiateOtpChallengeData = Joi.compile(initiateOTPChallengeSchema.headers).prefs({
      errors: { label: 'key' },
      abortEarly: false,
    });
  });
  afterEach(async () => {
    initiateOtpChallengeData = '';
  });
  test('Should validate param headers', async () => {
    const { error } = initiateOtpChallengeData.validate(deviceParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_AUTH_DEVICE_ENROLLMENT_TOKEN_PARAMS);
  });
  test('Should validate no authorization params', async () => {
    const { error } = initiateOtpChallengeData.validate(deviceParameters.missingParameterAuthIniateOTPChallenge);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_AUTHORIZATION);
  });
  test('Should validate no device enrollment token params', async () => {
    const { error } = initiateOtpChallengeData.validate(deviceParameters.expectingAuthorization);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_TOKEN);
  });
  test('Should validate empty auth and enrollment token', async () => {
    const { error } = initiateOtpChallengeData.validate(deviceParameters.emptyParameterAuthIniateOTPChallenge);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.EMPTY_AUTH_DEVICE_ENROLLMENT_TOKEN);
  });
  test('Should validate integer auth and enrollment token ', async () => {
    const { error } = initiateOtpChallengeData.validate(deviceParameters.integerParameterAuthIniateOTPChallenge);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.INTEGER_AUTH_DEVICE_ENROLLMENT_TOKEN);
  });
  test('Should validate initiate otp challenge', async () => {
    const { error } = initiateOtpChallengeData.validate(deviceParameters.expectParameterAuthIniateOTPChallenge);
    expect(error).toBeUndefined();
  });
});

describe('Answer Challenge Schema', () => {
  let answerChallengeHeader, answerChallengeBody;
  beforeEach(async () => {
    answerChallengeHeader = Joi.compile(answerChallengeSchema.headers).prefs({
      errors: { label: 'key' },
      abortEarly: false,
    });
    answerChallengeBody = Joi.compile(answerChallengeSchema.body).prefs({ errors: { label: 'key' }, abortEarly: false });
  });
  afterEach(async () => {
    answerChallengeHeader = '';
    answerChallengeBody = '';
  });
  test('Should validate param headers', async () => {
    const { error } = answerChallengeHeader.validate(deviceParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_AUTH_DEVICE_ENROLLMENT_TOKEN_PARAMS);
  });
  test('Should validate no authorization params', async () => {
    const { error } = answerChallengeHeader.validate(deviceParameters.missingParameterAuthIniateOTPChallenge);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_AUTHORIZATION);
  });
  test('Should validate no device enrollment token params', async () => {
    const { error } = answerChallengeHeader.validate(deviceParameters.expectingAuthorization);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_TOKEN);
  });
  test('Should validate empty auth and enrollment token', async () => {
    const { error } = answerChallengeHeader.validate(deviceParameters.emptyParameterAuthIniateOTPChallenge);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.EMPTY_AUTH_DEVICE_ENROLLMENT_TOKEN);
  });
  test('Should validate integer auth and enrollment token ', async () => {
    const { error } = answerChallengeHeader.validate(deviceParameters.integerParameterAuthIniateOTPChallenge);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.INTEGER_AUTH_DEVICE_ENROLLMENT_TOKEN);
  });
  test('Should validate answer challenge header', async () => {
    const { error } = answerChallengeHeader.validate(deviceParameters.expectParameterAuthIniateOTPChallenge);
    expect(error).toBeUndefined();
  });

  test('Should validate if request body params exists', async () => {
    const { error } = answerChallengeBody.validate(deviceParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_ANSWER_CHALLENGE_BODY_PARAMS);
  });
  test('Should validate if request body params otpId exists', async () => {
    const { error } = answerChallengeBody.validate(deviceParameters.missingOtpId);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_OTPID_BODY_PARAMS);
  });
  test('Should validate if request body params otp exists', async () => {
    const { error } = answerChallengeBody.validate(deviceParameters.missingOtp);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_OTP_BODY_PARAMS);
  });
  test('Should validate if request body params are integers', async () => {
    const { error } = answerChallengeBody.validate(deviceParameters.integerOtpIDandOTP);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.INTEGER_OTPID_OTP_BODY_PARAMS);
  });
  test('Should validate request body params', async () => {
    const { error } = answerChallengeBody.validate(deviceParameters.otpIdandOtp);
    expect(error).toBeUndefined();
  });
});

describe('Confirm Trusted Device Schema', () => {
  let confirmTrustedDeviceHeader, confirmTrustedDeviceBody;
  beforeEach(async () => {
    confirmTrustedDeviceHeader = Joi.compile(confirmTrustedDeviceSchema.headers).prefs({
      errors: { label: 'key' },
      abortEarly: false,
    });
    confirmTrustedDeviceBody = Joi.compile(confirmTrustedDeviceSchema.body).prefs({
      errors: { label: 'key' },
      abortEarly: false,
    });
  });
  afterEach(async () => {
    confirmTrustedDeviceHeader = '';
    confirmTrustedDeviceBody = '';
  });
  test('Should validate param headers', async () => {
    const { error } = confirmTrustedDeviceHeader.validate(deviceParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_AUTH_DEVICE_ENROLLMENT_TOKEN_PARAMS);
  });
  test('Should validate no authorization params', async () => {
    const { error } = confirmTrustedDeviceHeader.validate(deviceParameters.missingParameterAuthIniateOTPChallenge);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_AUTHORIZATION);
  });
  test('Should validate no device enrollment token params', async () => {
    const { error } = confirmTrustedDeviceHeader.validate(deviceParameters.expectingAuthorization);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_TOKEN);
  });
  test('Should validate empty auth and enrollment token', async () => {
    const { error } = confirmTrustedDeviceHeader.validate(deviceParameters.emptyParameterAuthIniateOTPChallenge);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.EMPTY_AUTH_DEVICE_ENROLLMENT_TOKEN);
  });
  test('Should validate integer auth and enrollment token ', async () => {
    const { error } = confirmTrustedDeviceHeader.validate(deviceParameters.integerParameterAuthIniateOTPChallenge);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.INTEGER_AUTH_DEVICE_ENROLLMENT_TOKEN);
  });
  test('Should validate confirm trusted device header', async () => {
    const { error } = confirmTrustedDeviceHeader.validate(deviceParameters.expectParameterAuthIniateOTPChallenge);
    expect(error).toBeUndefined();
  });
  test('Should validate confirm trusted device header', async () => {
    const { error } = confirmTrustedDeviceHeader.validate(deviceParameters.expectParameterAuthIniateOTPChallenge);
    expect(error).toBeUndefined();
  });

  test('Should validate confirm trusted device body params if exists', async () => {
    const { error } = confirmTrustedDeviceBody.validate(deviceParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_INAPP_OTP_BODY_PARAMS);
  });
  test('Should validate confirm trusted device body params if empty', async () => {
    const { error } = confirmTrustedDeviceBody.validate(deviceParameters.emptyInAppOtp);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.EMPTY_INAPP_OTP_BODY_PARAMS);
  });
  test('Should validate confirm trusted device body params if integer', async () => {
    const { error } = confirmTrustedDeviceBody.validate(deviceParameters.integerInAppOtp);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.INTEGER_INAPP_OTP_BODY_PARAMS);
  });
  test('Should validate confirm trusted device body params', async () => {
    const { error } = confirmTrustedDeviceBody.validate(deviceParameters.expectInAppOtp);
    expect(error).toBeUndefined();
  });
});

describe('Untrust Device Schema', () => {
  let untrustHeaderData, untrustBodyData;
  beforeEach(async () => {
    untrustHeaderData = Joi.compile(untrustSchema.headers).prefs({ errors: { label: 'key' }, abortEarly: false });
    untrustBodyData = Joi.compile(untrustSchema.pathParameters).prefs({ errors: { label: 'key' }, abortEarly: false });
  });
  afterEach(async () => {
    untrustHeaderData = '';
    untrustBodyData = '';
  });
  test('Should validate missing authorization', async () => {
    const { error } = untrustHeaderData.validate(deviceParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_AUTHORIZATION);
  });
  test('Should validate empty authorization', async () => {
    const { error } = untrustHeaderData.validate(deviceParameters.emptyAuthorization);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.EMPTY_AUTHORIZATION);
  });
  test('Should validate integer authorization', async () => {
    const { error } = untrustHeaderData.validate(deviceParameters.integerAuth);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.AUTHORIZATION_MUST_STRING);
  });
  test('Should validate authorization', async () => {
    const { error } = untrustHeaderData.validate(deviceParameters.expectingAuthorization);
    expect(error).toBeUndefined();
  });

  test('Should validate missing path params', async () => {
    const { error } = untrustBodyData.validate(deviceParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_DEVICE_ID_PATH_PARAMS);
  });
  test('Should validate empty device id', async () => {
    const { error } = untrustBodyData.validate(deviceParameters.emptyDeviceId);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.EMPTY_DEVICE_ID_PATH_PARAMS);
  });
  test('Should validate integer device id', async () => {
    const { error } = untrustBodyData.validate(deviceParameters.integerDeviceId);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.INTEGER_DEVICE_ID_PATH_PARAMS);
  });
  test('Should validate untrust device path params', async () => {
    const { error } = untrustBodyData.validate(deviceParameters.expectDeviceId);
    expect(error).toBeUndefined();
  });
});

describe('Check if Trusted Device Schema', () => {
  let checkifDeviceHeaders;
  beforeEach(async () => {
    checkifDeviceHeaders = Joi.compile(checkIfTrustedSchema.headers).prefs({
      errors: { label: 'key' },
      abortEarly: false,
    });
  });
  afterEach(async () => {
    checkifDeviceHeaders = '';
  });
  test('Should validate missing authorization', async () => {
    const { error } = checkifDeviceHeaders.validate(deviceParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_AUTHORIZATION);
  });
  test('Should validate empty authorization', async () => {
    const { error } = checkifDeviceHeaders.validate(deviceParameters.emptyAuthorization);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.EMPTY_AUTHORIZATION);
  });
  test('Should validate integer authorization', async () => {
    const { error } = checkifDeviceHeaders.validate(deviceParameters.integerAuth);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.AUTHORIZATION_MUST_STRING);
  });
  test('Should validate authorization', async () => {
    const { error } = checkifDeviceHeaders.validate(deviceParameters.expectingAuthorization);
    expect(error).toBeUndefined();
  });
});

describe('TOTP Validate Schema', () => {
    let totpValidateHeader, totpValidateBody;
    beforeEach(async () => {
        totpValidateHeader = Joi.compile(totpValidateSchema.headers).prefs({
        errors: { label: 'key' },
        abortEarly: false,
      });
      totpValidateBody = Joi.compile(totpValidateSchema.body).prefs({
        errors: { label: 'key' },
        abortEarly: false,
      });
    });
    afterEach(async () => {
        totpValidateHeader = '';
        totpValidateBody = '';
    });
    test('Should validate param headers', async () => {
      const { error } = totpValidateHeader.validate(deviceParameters.missingParameter);
      expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_AUTH_UD_DEVICE_ID_PARAMS);
    });
    test('Should validate no authorization params', async () => {
      const { error } = totpValidateHeader.validate(deviceParameters.missingAuthTOTPValidate);
      expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_AUTHORIZATION);
    });
    test('Should validate no device enrollment token params', async () => {
      const { error } = totpValidateHeader.validate(deviceParameters.expectingAuthorization);
      expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.DEVICE_ENROLLMENT_DEVICE_ID_HEADER_ERROR);
    });
    test('Should validate empty auth and enrollment token', async () => {
      const { error } = totpValidateHeader.validate(deviceParameters.emptyAuthTOTPValidate);
      expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.EMPTY_AUTH_UD_DEVICE_ID_TOKEN);
    });
    test('Should validate integer auth and enrollment token ', async () => {
      const { error } = totpValidateHeader.validate(deviceParameters.integerAuthTOTPValidate);
      expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.INTEGER_AUTH_UD_DEVICE_ID_PARAMS);
    });
    test('Should validate confirm trusted device header', async () => {
      const { error } = totpValidateHeader.validate(deviceParameters.expectTOTPValidate);
      expect(error).toBeUndefined();
    });
  
    test('Should validate confirm trusted device body params if exists', async () => {
      const { error } = totpValidateBody.validate(deviceParameters.missingParameter);
      expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_INAPP_OTP_BODY_PARAMS);
    });
    test('Should validate confirm trusted device body params if empty', async () => {
      const { error } = totpValidateBody.validate(deviceParameters.emptyInAppOtp);
      expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.EMPTY_INAPP_OTP_BODY_PARAMS);
    });
    test('Should validate confirm trusted device body params if integer', async () => {
      const { error } = totpValidateBody.validate(deviceParameters.integerInAppOtp);
      expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.INTEGER_INAPP_OTP_BODY_PARAMS);
    });
    test('Should validate confirm trusted device body params', async () => {
      const { error } = totpValidateBody.validate(deviceParameters.expectInAppOtp);
      expect(error).toBeUndefined();
    });
  });