const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { mockClient } = require('aws-sdk-client-mock');
const { handler } = require('../../../../../src/handlers/token/verify/v1');
const { drop, seed, sync } = require('../../../../utils/base-sync');
const { sessionA } = require('../../../../fixtures/auth-service-db');
const context = require('../../../../utils/lambda-context');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const { UserSessions } = require('../../../../../src/models/index');
const { randomUUID } = require('crypto');

const kmsMock = mockClient(KMSClient);

describe('handler-token-verify', () => {
  beforeAll(async () => {
    sessionId = randomUUID();
    await sync();
    sessionA.id = sessionId;
    await seed('UserSessions', sessionA);
  });

  afterAll(async () => {
    await drop();
  });

  beforeEach(() => {
    kmsMock.reset();
    eventData = structuredClone(context().event);
  });

  test('should be able to verify valid token and return the token payload', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });

    const token = await sign({ data: 'data' });
    await UserSessions.update({ accessToken: token, isValid: true }, { where: { id: sessionId } });
    eventData.body = JSON.stringify({ token });

    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 200,
      requestId: expect.any(String),
      code: 'JWT_VERIFIED',
      data: {
        iat: expect.any(Number),
        exp: expect.any(Number),
        data: 'data',
      },
    });
  });

  test('should throw an error when token is not valid', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: false,
    });

    const token = await sign({ data: 'data' });
    eventData.body = JSON.stringify({ token });
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'JWT_INVALID',
      data: {
        message: 'JWT_INVALID',
      },
    });
  });

  test('should throw an error when token is not found in sessions table', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });

    const token = await sign({ data: 'datab' });
    eventData.body = JSON.stringify({ token });

    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'JWT_INVALID',
      data: {
        message: 'JWT_INVALID',
      },
    });
  });

  test('should invalidate tokens ', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: false,
    });

    const token = await sign({ data: 'data' });
    eventData.body = JSON.stringify({ token });
    await UserSessions.update({ accessToken: token, isValid: true }, { where: { id: sessionId } });
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    const session = await UserSessions.findByPk(sessionId);

    expect(session.isValid).toBe(false);
    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'JWT_INVALID',
      data: {
        message: 'JWT_INVALID',
      },
    });
  });
});
