const Joi = require('joi');
const { accessTokenSchema } = require('../../../../src/utils/validators/token');

describe('validation-token', () => {
  describe('accessTokenSchema', () => {
    const accessTokenShape = {
      body: {
        token: 'token',
      },
    };

    const joiSchema = Joi.compile(accessTokenSchema).prefs({ abortEarly: true });

    test('should allow valid params', () => {
      const { error } = joiSchema.validate(accessTokenShape);
      expect(error).toBeUndefined();
    });

    test('should be able to validate token field', () => {
      accessTokenShape.body.token = 12312312312;
      const { error: errorInvalid } = joiSchema.validate(accessTokenShape);
      expect(errorInvalid.message).toBe('"body.token" must be a string');

      delete accessTokenShape.body.token;
      const { error: errorMissing } = joiSchema.validate(accessTokenShape);
      expect(errorMissing.message).toBe('"body.token" is required');
    });
  });
});
