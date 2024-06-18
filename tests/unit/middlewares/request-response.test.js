const { before, after, onError } = require('../../../src/middlewares/request-response-middleware')();
const context = require('../../utils/lambda-context');

let data;

describe('middleware-request-response', () => {
  beforeEach(() => {
    data = context(JSON.stringify({ data: 'data' }));
  });

  describe('before', () => {
    test('should parse body to json if content type is application/json', async () => {
      await before(data);
      expect(typeof data.event.body).toBe('object');
      expect(data.event.body).toEqual({ data: 'data' });
    });

    test('should parse buffer body to json if content type is application/json', async () => {
      data.event.isBase64Encoded = true;
      data.event.body = Buffer.from(JSON.stringify({ data: 'data' })).toString('base64');
      await before(data);
      expect(typeof data.event.body).toBe('object');
      expect(data.event.body).toEqual({ data: 'data' });
    });

    test('should throw an error if not json parsable and content type is application/json', async () => {
      data.event.headers = { 'content-type': 'application/json' };
      data.event.body = 'string';
      await expect(before(data)).rejects.toThrow('Invalid or malformed JSON was provided');
    });

    test('should not parse anything when content type is not application/json', async () => {
      data.event.headers = { 'content-type': 'application/text' };
      data.event.body = 'string';
      await before(data);
      expect(typeof data.event.body).toBe('string');
      expect(data.event.body).toEqual('string');
    });
  });

  describe('after', () => {
    test('should return the default json response format', async () => {
      data.response = { data: { qwe: 'qwe' }, code: 'CODE' };
      const response = await after(data);
      expect(response).toMatchObject({
        headers: expect.any(Object),
        statusCode: expect.any(Number),
        body: expect.any(String),
      });

      const responseData = JSON.parse(response.body);
      expect(responseData).toMatchObject({
        status: expect.any(Number),
        code: expect.any(String),
        data: expect.anything(),
      });
    });

    test('should be able to cater other content type responses', async () => {
      data.response = { data: 'text', headers: { 'Content-Type': 'application/text' } };
      const response = await after(data);
      expect(response).toMatchObject({
        headers: expect.any(Object),
        statusCode: expect.any(Number),
        body: expect.any(String),
      });
    });
  });

  describe('onError', () => {
    test('should be able to return json response format on error', async () => {
      data.error = new Error('Error');
      const response = await onError(data);
      expect(response).toMatchObject({
        headers: expect.any(Object),
        statusCode: expect.any(Number),
        body: expect.any(String),
      });

      const responseData = JSON.parse(response.body);
      expect(responseData).toMatchObject({
        status: expect.any(Number),
        code: expect.any(String),
        data: {
          message: expect.any(String),
        },
      });
    });
  });
});
