const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { mockClient } = require('aws-sdk-client-mock');
const verifyTokenMiddleware = require('../../../src/middlewares/verify-token-middleware');
const context = require('../../utils/lambda-context');
const { sign } = require('../../../src/utils/helpers/jwt-helperv2');

const kmsMock = mockClient(KMSClient);

const data = context({
  name: 'name',
});

describe('middleware-verify-token', () => {
  beforeEach(() => {
    kmsMock.reset();
  });

  test('will not run when no schema passed', async () => {
    await expect(verifyTokenMiddleware(null).before(data)).resolves.toBeUndefined();
  });

  test('should verify token and return the decodedToken and rawToken to lambda event', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({ data: 'data' });

    data.event.headers = {
      authorization: token,
    };

    await verifyTokenMiddleware('authorization').before(data);

    expect(data.event).toMatchObject({
      decodedToken: {
        iat: expect.any(Number),
        exp: expect.any(Number),
        data: expect.any(String),
      },
      rawToken: token,
    });
  });

  test('should verify token with bearer prefix and return the decodedToken and rawToken to lambda event', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({ data: 'data' });

    data.event.headers = {
      authorization: `Bearer ${token}`,
    };

    await verifyTokenMiddleware('authorization').before(data);

    expect(data.event).toMatchObject({
      decodedToken: {
        iat: expect.any(Number),
        exp: expect.any(Number),
        data: expect.any(String),
      },
      rawToken: token,
    });
  });

  test('should throw an error when token is invalid', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: false,
    });
    const token = await sign({ data: 'data' });

    data.event.headers = {
      authorization: `Bearer ${token}`,
    };

    expect(verifyTokenMiddleware('authorization').before(data)).rejects.toThrow('JWT_INVALID');
  });
});
