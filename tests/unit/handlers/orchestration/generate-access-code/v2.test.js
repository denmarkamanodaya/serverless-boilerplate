const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { orchestrationParameters } = require('../../../../fixtures/orchestration-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const axios = require('axios').default;
const AxiosMockAdapter = require('axios-mock-adapter');
const { Users } = require('../../../../../src/models/index');
const { userA } = require('../../../../fixtures/auth-service-db');
const { drop, seed, sync } = require('../../../../utils/base-sync');

const kmsMock = mockClient(KMSClient);
let mockAxios = new AxiosMockAdapter(axios);
let generateAccessCode;

describe('Orchestration Handler', () => {
  beforeAll(async () => {
    await sync();
    userA.username = '123456';
    await seed('Users', userA);
  });

  afterAll(async () => {
    await drop();
  });

  beforeEach(async () => {
    kmsMock.reset();
    mockAxios.reset();
    process.env.NODE_ENV = 'test';
    generateAccessCode = require('../../../../../src/handlers/orchestration/generate-access-code/v2').handler;
  });

  test('POST /orchestration/generate-access-code. Should error missing body', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      mobileNumber: orchestrationParameters.handler.user.username,
    });
    const request = event({
      method: 'POST',
      headers: {
        authorization: `Bearere ${token}`,
      },
      body: {},
    });
    const response = await generateAccessCode(request);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('"version" is required. "kosmosDid" is required');
  });

  test('POST /orchestration/generate-access-code. Should return 1Kosmos 404', async () => {
    mockAxios.onPost().reply(200, {
      data: [
        {
          username: '123456',
          email: 'test@email.com',
          firstname: 'firstname',
          lastname: 'lastname',
          uid: '123456',
        },
      ],
    });
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      mobileNumber: orchestrationParameters.handler.user.username,
    });
    const request = event({
      method: 'POST',
      headers: {
        authorization: `Bearere ${token}`,
      },
      body: {
        version: 'athena',
        kosmosDid: '123456',
      },
    });
    const response = await generateAccessCode(request);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    expect(data.data.message).toBe('Request failed with status code 404');
  });

  test('POST /orchestration/generate-access-code. Should return 401 / unauthorized token', async () => {
    const request = event({
      method: 'POST',
      headers: {
        authorization: orchestrationParameters.handler.token,
      },
      body: {
        version: 'athena',
        kosmosDid: '123456',
      },
    });
    const response = await generateAccessCode(request);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('JWT_INVALID');
  });

  test('POST /orchestration/generate-access-code. should success / return 200', async () => {
    mockAxios.onPost().reply(200, {
      data: [
        {
          username: '123456',
          email: 'test@email.com',
          firstname: 'firstname',
          lastname: 'lastname',
          uid: '123456',
        },
      ],
    });
    mockAxios.onPut().reply(200, {
      data: {
        code: '123456',
        accesLink: 'test@email.com',
        uid: '123456',
      },
    });
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      mobileNumber: orchestrationParameters.handler.user.username,
    });
    const request = event({
      method: 'POST',
      headers: {
        authorization: `Bearere ${token}`,
      },
      body: {
        version: 'athena',
        kosmosDid: '123456',
      },
    });
    const response = await generateAccessCode(request);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
    expect(data).toMatchObject({
      status: 200,
      code: 'VALID',
      data: expect.any(Object),
    });
  });
});
