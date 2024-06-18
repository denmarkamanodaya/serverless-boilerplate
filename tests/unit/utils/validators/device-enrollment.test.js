const Joi = require('joi');
const {
  validateDeviceEnrollment,
  validateDeviceEnrollmentToken,
  validateDeviceEnrollmentOtp,
  validateDeviceEnrollmentConfirmation,
  validateDeviceUnEnrollment,
  validateInAppOTP,
  validateConfirmTrustedDevice,
} = require('../../../../src/utils/validators/device-enrollment');
const {JOI_VALIDATION_TEST_ERRORS} = require('../../../utils/constants/error-messages');
const { deviceEnrollmentParameters } = require('../../../fixtures/device-enrollment-fixtures');

describe('Validate Device Enrollment', () => {
  let compileData;
  beforeEach(async () => {
    compileData = Joi.compile(validateDeviceEnrollment.headers)
    .prefs({ errors: { label: 'key' }, abortEarly: false });
  });
  afterEach(async() => {
    compileData = '';
  });
  test('Should validate missing param', async () => {
    const { error } = compileData.validate(deviceEnrollmentParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_PARAMS);
  });
  test('Should validate missing device make model', async () => {
    const { error } = compileData.validate(deviceEnrollmentParameters.missingMakeModel);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_MODEL);
  });
  test('Should validate missing device id', async () => {
    const { error } = compileData.validate(deviceEnrollmentParameters.missingDeviceModel);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_ID);
  });
  test('Should validate both params exists', async () => {
    const { error } = compileData.validate(deviceEnrollmentParameters.expectParametersDeviceEnrollment);
    expect(error).toBeUndefined();
  });
});

describe('Validate Device Enrollment Token', () => {
  let compileDataToken;
  beforeEach(async () => {
    compileDataToken = Joi.compile(validateDeviceEnrollmentToken.headers)
    .prefs({ errors: { label: 'key' }, abortEarly: false });
  });
  test('Should validate missing param', async () => {
    const { error } = compileDataToken.validate(deviceEnrollmentParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_TOKEN);
  });
  test('Should validate missing device enrollement token', async () => {
    const { error } = compileDataToken.validate(deviceEnrollmentParameters.missingDeviceEnrollmentToken);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_TOKEN);
  });
  test('Should validate missing device id', async () => {
    const { error } = compileDataToken.validate(deviceEnrollmentParameters.missingDeviceEnrollmentDeviceId);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_ID);
  });
  test('Should validate both params exists', async () => {
    const { error } = compileDataToken.validate(deviceEnrollmentParameters.expectParametersDeviceEnrollmentToken);
    expect(error).toBeUndefined();
  });
});

describe('Validate Device Enrollment OTP', () => {
  let compileDataOtp;
  beforeEach(async () => {
    compileDataOtp = Joi.compile(validateDeviceEnrollmentOtp.headers)
    .prefs({ errors: { label: 'key' }, abortEarly: false });
  });
  test('Should validate missing param', async () => {
    const { error } = compileDataOtp.validate(deviceEnrollmentParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_TOKEN);
  });
  test('Should validate missing device enrollement token', async () => {
    const { error } = compileDataOtp.validate(deviceEnrollmentParameters.missingDeviceEnrollmentToken);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_TOKEN);
  });
  test('Should validate missing device id', async () => {
    const { error } = compileDataOtp.validate(deviceEnrollmentParameters.missingDeviceEnrollmentDeviceId);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_ID);
  });
  test('Should validate both params exists', async () => {
    const { error } = compileDataOtp.validate(deviceEnrollmentParameters.expectParametersDeviceEnrollmentToken);
    expect(error).toBeUndefined();
  });
});

describe('Validate Device Enrollment Confirmation', () => {
  let compileDataConfirmation;
  beforeEach(async () => {
    compileDataConfirmation = Joi.compile(validateDeviceEnrollmentConfirmation.headers)
    .prefs({ errors: { label: 'key' }, abortEarly: false });
  });
  test('Should validate missing param', async () => {
    const { error } = compileDataConfirmation.validate(deviceEnrollmentParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_TOKEN);
  });
  test('Should validate missing device enrollement token', async () => {
    const { error } = compileDataConfirmation.validate(deviceEnrollmentParameters.missingDeviceEnrollmentToken);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_TOKEN);
  });
  test('Should validate missing device id', async () => {
    const { error } = compileDataConfirmation.validate(deviceEnrollmentParameters.missingDeviceEnrollmentDeviceId);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_ID);
  });
  test('Should validate both params exists', async () => {
    const { error } = compileDataConfirmation.validate(deviceEnrollmentParameters.expectParametersDeviceEnrollmentToken);
    expect(error).toBeUndefined();
  });
});

describe('Validate Device Unenrollment', () => {
  let compileDataConfirmation;
  beforeEach(async () => {
    compileDataConfirmation = Joi.compile(validateDeviceUnEnrollment.headers)
    .prefs({ errors: { label: 'key' }, abortEarly: false });
  });
  test('Should validate missing param', async () => {
    const { error } = compileDataConfirmation.validate(deviceEnrollmentParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_ID);
  });
  test('Should validate x-ud-device-id exists', async () => {
    const { error } = compileDataConfirmation.validate(deviceEnrollmentParameters.expectParameterDeviceId);
    expect(error).toBeUndefined();
  });
});

describe('Validate In App OTP', () => {
  let compileDataConfirmation;
  beforeEach(async () => {
    compileDataConfirmation = Joi.compile(validateInAppOTP.headers)
    .prefs({ errors: { label: 'key' }, abortEarly: false });
  });
  test('Should validate missing param', async () => {
    const { error } = compileDataConfirmation.validate(deviceEnrollmentParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_ID);
  });
  test('Should validate x-ud-device-id exists', async () => {
    const { error } = compileDataConfirmation.validate(deviceEnrollmentParameters.expectParameterDeviceId);
    expect(error).toBeUndefined();
  });
});

describe('Validate Device Confirm Trusted Device', () => {
  let compileDataConfirmation;
  beforeEach(async () => {
    compileDataConfirmation = Joi.compile(validateConfirmTrustedDevice.headers)
    .prefs({ errors: { label: 'key' }, abortEarly: false });
  });
  test('Should validate missing param', async () => {
    const { error } = compileDataConfirmation.validate(deviceEnrollmentParameters.missingParameter);
    expect(error.message).toBe(JOI_VALIDATION_TEST_ERRORS.MISSING_SESSION_DEVICE_ENROLLMENT_DEVICE_ID);
  });
  test('Should validate x-ud-device-id exists', async () => {
    const { error } = compileDataConfirmation.validate(deviceEnrollmentParameters.expectParameterDeviceId);
    expect(error).toBeUndefined();
  });
});