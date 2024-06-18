const Joi = require('joi');

const validationMiddleware = require('../../../src/middlewares/validation-middleware');
const context = require('../../utils/lambda-context');

const { before } = validationMiddleware({
  body: Joi.object({
    name: Joi.string().required().trim(),
  }).required(),
});

const data = context({
  name: 'name',
});

describe('middleware-validation', () => {
  test('will not run when no schema passed', async () => {
    await expect(validationMiddleware(null).before(data)).resolves.toBeUndefined();
  });

  test('should be able to validate correct field value', async () => {
    await expect(before(data)).resolves.toBeUndefined();
  });

  test('should be able to validate incorrect field value', async () => {
    data.event.body.name = 123;
    await expect(before(data)).rejects.toThrow('"name" must be a string');
  });

  test('should do sanitization and replace event data', async () => {
    data.event.body.name = '                   valueWithSpaces                         ';
    await before(data);
    expect(data.event.body.name).toBe('valueWithSpaces');
  });
});
