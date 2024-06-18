const Joi = require('joi');
const {
  validateUserRegMobileVerification,
  userRegOtpVerification,
  validateUserRegUserCreation,
} = require('../../../../src/utils/validators/user-registration');

describe('validation-user-registration', () => {
  describe('validateUserRegMobileVerification', () => {
    const userRegMobileVerificationShape = {
      body: {
        countryCode: '63',
        mobileNumber: '631111111111',
      },
    };

    const joiSchema = Joi.compile(validateUserRegMobileVerification).prefs({ abortEarly: true });

    test('should allow valid params', () => {
      const { error } = joiSchema.validate(userRegMobileVerificationShape);
      expect(error).toBeUndefined();
    });

    test('should be able to validate countryCode field', () => {
      userRegMobileVerificationShape.body.countryCode = '12312312321';
      const { error: errorInvalid } = joiSchema.validate(userRegMobileVerificationShape);
      expect(errorInvalid.message).toBe('"body.countryCode" must be [63]');

      delete userRegMobileVerificationShape.body.countryCode;
      const { error: errorMissing } = joiSchema.validate(userRegMobileVerificationShape);
      expect(errorMissing.message).toBe('"body.countryCode" is required');
    });

    test('should be able to validate mobileNumber field', () => {
      userRegMobileVerificationShape.body.countryCode = '63';
      userRegMobileVerificationShape.body.mobileNumber = 12312312321312312321;
      const { error: errorInvalid } = joiSchema.validate(userRegMobileVerificationShape);
      expect(errorInvalid.message).toBe('"body.mobileNumber" must be a string');

      delete userRegMobileVerificationShape.body.mobileNumber;
      const { error: errorMissing } = joiSchema.validate(userRegMobileVerificationShape);
      expect(errorMissing.message).toBe('"body.mobileNumber" is required');
    });
  });

  describe('userRegOtpVerification', () => {
    const userRegOtpVerificationShape = {
      body: {
        countryCode: '63',
        mobileNumber: '631111111111',
        otp: '123456',
        token: 'token',
      },
    };

    const joiSchema = Joi.compile(userRegOtpVerification).prefs({ abortEarly: true });

    test('should allow valid params', () => {
      const { error } = joiSchema.validate(userRegOtpVerificationShape);
      expect(error).toBeUndefined();
    });

    test('should be able to validate countryCode field', () => {
      userRegOtpVerificationShape.body.countryCode = 12312312321;
      const { error: errorInvalid } = joiSchema.validate(userRegOtpVerificationShape);
      expect(errorInvalid.message).toBe('"body.countryCode" must be a string');

      delete userRegOtpVerificationShape.body.countryCode;
      const { error: errorMissing } = joiSchema.validate(userRegOtpVerificationShape);
      expect(errorMissing.message).toBe('"body.countryCode" is required');
    });

    test('should be able to validate mobileNumber field', () => {
      userRegOtpVerificationShape.body.countryCode = '63';
      userRegOtpVerificationShape.body.mobileNumber = 12312312321312312321;
      const { error: errorInvalid } = joiSchema.validate(userRegOtpVerificationShape);
      expect(errorInvalid.message).toBe('"body.mobileNumber" must be a string');

      delete userRegOtpVerificationShape.body.mobileNumber;
      const { error: errorMissing } = joiSchema.validate(userRegOtpVerificationShape);
      expect(errorMissing.message).toBe('"body.mobileNumber" is required');
    });

    test('should be able to validate otp field', () => {
      userRegOtpVerificationShape.body.mobileNumber = '631111111111';
      userRegOtpVerificationShape.body.otp = 12312312321312312321;
      const { error: errorInvalid } = joiSchema.validate(userRegOtpVerificationShape);
      expect(errorInvalid.message).toBe('"body.otp" must be a string');

      delete userRegOtpVerificationShape.body.otp;
      const { error: errorMissing } = joiSchema.validate(userRegOtpVerificationShape);
      expect(errorMissing.message).toBe('"body.otp" is required');
    });

    test('should be able to validate token field', () => {
      userRegOtpVerificationShape.body.otp = '123456';
      userRegOtpVerificationShape.body.token = 12312312321312312321;
      const { error: errorInvalid } = joiSchema.validate(userRegOtpVerificationShape);
      expect(errorInvalid.message).toBe('"body.token" must be a string');

      delete userRegOtpVerificationShape.body.token;
      const { error: errorMissing } = joiSchema.validate(userRegOtpVerificationShape);
      expect(errorMissing.message).toBe('"body.token" is required');
    });
  });

  describe('validateUserRegUserCreation', () => {
    const userRegUserCreationShape = {
      body: {
        countryCode: '63',
        mobileNumber: '631111111111',
        username: 'username',
        password: 'password',
        oneTimeToken: 'token',
      },
    };

    const joiSchema = Joi.compile(validateUserRegUserCreation).prefs({ abortEarly: true });

    test('should allow valid params', () => {
      const { error } = joiSchema.validate(userRegUserCreationShape);
      expect(error).toBeUndefined();
    });

    test('should be able to validate countryCode field', () => {
      userRegUserCreationShape.body.countryCode = 12312312321;
      const { error: errorInvalid } = joiSchema.validate(userRegUserCreationShape);
      expect(errorInvalid.message).toBe('"body.countryCode" must be a string');

      delete userRegUserCreationShape.body.countryCode;
      const { error: errorMissing } = joiSchema.validate(userRegUserCreationShape);
      expect(errorMissing.message).toBe('"body.countryCode" is required');
    });

    test('should be able to validate mobileNumber field', () => {
      userRegUserCreationShape.body.countryCode = '63';
      userRegUserCreationShape.body.mobileNumber = 12312312321312312321;
      const { error: errorInvalid } = joiSchema.validate(userRegUserCreationShape);
      expect(errorInvalid.message).toBe('"body.mobileNumber" must be a string');

      delete userRegUserCreationShape.body.mobileNumber;
      const { error: errorMissing } = joiSchema.validate(userRegUserCreationShape);
      expect(errorMissing.message).toBe('"body.mobileNumber" is required');
    });

    test('should be able to validate username field', () => {
      userRegUserCreationShape.body.mobileNumber = '631111111111';
      userRegUserCreationShape.body.username = 12312312321312312321;
      const { error: errorInvalid } = joiSchema.validate(userRegUserCreationShape);
      expect(errorInvalid.message).toBe('"body.username" must be a string');

      delete userRegUserCreationShape.body.username;
      const { error: errorMissing } = joiSchema.validate(userRegUserCreationShape);
      expect(errorMissing.message).toBe('"body.username" is required');
    });

    test('should be able to validate password field', () => {
      userRegUserCreationShape.body.username = 'username';
      userRegUserCreationShape.body.password = 12312312321312312321;
      const { error: errorInvalid } = joiSchema.validate(userRegUserCreationShape);
      expect(errorInvalid.message).toBe('"body.password" must be a string');

      delete userRegUserCreationShape.body.password;
      const { error: errorMissing } = joiSchema.validate(userRegUserCreationShape);
      expect(errorMissing.message).toBe('"body.password" is required');
    });

    test('should be able to validate oneTimeToken field', () => {
      userRegUserCreationShape.body.password = 'password';
      userRegUserCreationShape.body.oneTimeToken = 12312312321312312321;
      const { error: errorInvalid } = joiSchema.validate(userRegUserCreationShape);
      expect(errorInvalid.message).toBe('"body.oneTimeToken" must be a string');

      delete userRegUserCreationShape.body.oneTimeToken;
      const { error: errorMissing } = joiSchema.validate(userRegUserCreationShape);
      expect(errorMissing.message).toBe('"body.oneTimeToken" is required');
    });
  });
});
