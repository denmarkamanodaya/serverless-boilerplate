const Joi = require('joi');
const { changePasswordSchema, requestResetPasswordSchema } = require('../../../../src/utils/validators/password');

describe('validation-token', () => {
  describe('changePasswordSchema', () => {
    const changePasswordShape = {
      body: {
        username: 'username',
        password: 'password',
        newPassword: 'newPassword',
        deviceId: 'deviceId',
        sessionId: 'sessionId',
      },
    };

    const joiSchema = Joi.compile(changePasswordSchema).prefs({ abortEarly: true });

    test('should allow valid params', () => {
      const { error } = joiSchema.validate(changePasswordShape);
      expect(error).toBeUndefined();
    });

    test('should be able to validate username field', () => {
      changePasswordShape.body.username = 12312312312;
      const { error: errorInvalid } = joiSchema.validate(changePasswordShape);
      expect(errorInvalid.message).toBe('"body.username" must be a string');

      delete changePasswordShape.body.username;
      const { error: errorMissing } = joiSchema.validate(changePasswordShape);
      expect(errorMissing.message).toBe('"body.username" is required');
    });

    test('should be able to validate password field', () => {
      changePasswordShape.body.username = 'username';
      changePasswordShape.body.password = 12312312312321;
      const { error: errorInvalid } = joiSchema.validate(changePasswordShape);
      expect(errorInvalid.message).toBe('"body.password" must be a string');

      delete changePasswordShape.body.password;
      const { error: errorMissing } = joiSchema.validate(changePasswordShape);
      expect(errorMissing.message).toBe('"body.password" is required');
    });

    test('should be able to validate newPassword field', () => {
      changePasswordShape.body.password = 'password';
      changePasswordShape.body.newPassword = 12312312312321;
      const { error: errorInvalid } = joiSchema.validate(changePasswordShape);
      expect(errorInvalid.message).toBe('"body.newPassword" must be a string');

      delete changePasswordShape.body.newPassword;
      const { error: errorMissing } = joiSchema.validate(changePasswordShape);
      expect(errorMissing.message).toBe('"body.newPassword" is required');
    });

    test('should be able to validate deviceId field', () => {
      changePasswordShape.body.newPassword = 'password';
      changePasswordShape.body.deviceId = 12312312312321;
      const { error: errorInvalid } = joiSchema.validate(changePasswordShape);
      expect(errorInvalid.message).toBe('"body.deviceId" must be a string');

      delete changePasswordShape.body.deviceId;
      const { error: errorOptional } = joiSchema.validate(changePasswordShape);
      expect(errorOptional).toBeUndefined();
    });

    test('should be able to validate sessionId field', () => {
      changePasswordShape.body.sessionId = 12312312312321;
      const { error: errorInvalid } = joiSchema.validate(changePasswordShape);
      expect(errorInvalid.message).toBe('"body.sessionId" must be a string');

      delete changePasswordShape.body.sessionId;
      const { error: errorOptional } = joiSchema.validate(changePasswordShape);
      expect(errorOptional).toBeUndefined();
    });
  });

  describe('requestResetPasswordSchema', () => {
    const requestResetPasswordShape = {
      body: {
        mobileNumber: 'mobileNumber',
        deviceId: 'deviceId',
        sessionId: 'sessionId',
      },
    };

    const joiSchema = Joi.compile(requestResetPasswordSchema).prefs({ abortEarly: true });

    test('should allow valid params', () => {
      const { error } = joiSchema.validate(requestResetPasswordShape);
      expect(error).toBeUndefined();
    });

    test('should be able to validate mobileNumber field', () => {
      requestResetPasswordShape.body.mobileNumber = 12312312312321;
      const { error: errorInvalid } = joiSchema.validate(requestResetPasswordShape);
      expect(errorInvalid.message).toBe('"body.mobileNumber" must be a string');

      delete requestResetPasswordShape.body.mobileNumber;
      const { error: errMissing } = joiSchema.validate(requestResetPasswordShape);
      expect(errMissing.message).toBe('"body.mobileNumber" is required');
    });

    test('should be able to validate deviceId field', () => {
      requestResetPasswordShape.body.mobileNumber = 'mobileNumber';
      requestResetPasswordShape.body.deviceId = 12312312312321;
      const { error: errorInvalid } = joiSchema.validate(requestResetPasswordShape);
      expect(errorInvalid.message).toBe('"body.deviceId" must be a string');

      delete requestResetPasswordShape.body.deviceId;
      const { error: errorOptional } = joiSchema.validate(requestResetPasswordShape);
      expect(errorOptional).toBeUndefined();
    });

    test('should be able to validate sessionId field', () => {
      requestResetPasswordShape.body.sessionId = 12312312312321;
      const { error: errorInvalid } = joiSchema.validate(requestResetPasswordShape);
      expect(errorInvalid.message).toBe('"body.sessionId" must be a string');

      delete requestResetPasswordShape.body.sessionId;
      const { error: errorOptional } = joiSchema.validate(requestResetPasswordShape);
      expect(errorOptional).toBeUndefined();
    });
  });
});
