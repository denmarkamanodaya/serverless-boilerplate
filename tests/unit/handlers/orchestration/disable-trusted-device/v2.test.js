const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { orchestrationParameters } = require('../../../../fixtures/orchestration-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const axios = require('axios').default;
const AxiosMockAdapter = require('axios-mock-adapter');
const { Devices, Users } = require('../../../../../src/models/index');
const { drop, seed, sync } = require('../../../../utils/base-sync');

const kmsMock = mockClient(KMSClient);
const dynamoMock = mockClient(DynamoDBClient);
let mockAxios = new AxiosMockAdapter(axios);
let disableTrustedDevice;

describe('Orchestration Handler', () => {
  beforeAll(async () => {
    await sync();
    await seed('Users', orchestrationParameters.handler.user);
    await seed('Devices', orchestrationParameters.handler.device);
  });

  afterAll(async () => {
    await drop();
  });

  beforeEach(async () => {
    kmsMock.reset();
    dynamoMock.reset();
    mockAxios.reset();
    process.env.NODE_ENV = 'test';
    disableTrustedDevice = require('../../../../../src/handlers/orchestration/disable-trusted-device/v2').handler;
  });

  test('POST /orchestration/disable-trusted-device. should error missing body', async () => {
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
        authorization: `Bearer ${token}`,
      },
      body: {},
    });
    const response = await disableTrustedDevice(request);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('"deviceId" is required');
  });

  test('POST /orchestration/disable-trusted-device. should error DEVICE_NOT_OWNED', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      mobileNumber: orchestrationParameters.handler.user.username,
      authUserId: orchestrationParameters.handler.user.id,
      deviceId: orchestrationParameters.handler.device.mobileInstanceId,
    });
    const request = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        deviceId: 'fake-device-id',
      },
    });
    const response = await disableTrustedDevice(request);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('DEVICE_NOT_OWNED');
  });

  test('POST /orchestration/disable-trusted-device. should error 500 onboarding-service', async () => {
    mockAxios.onGet().replyOnce(500, { data: { data: { message: 'Error' }, code: 500 } });
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      mobileNumber: orchestrationParameters.handler.user.username,
      authUserId: orchestrationParameters.handler.user.id,
      deviceId: orchestrationParameters.handler.device.mobileInstanceId,
    });
    const request = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        deviceId: orchestrationParameters.handler.device.mobileInstanceId,
      },
    });
    const response = await disableTrustedDevice(request);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
  });

  test('POST /orchestration/disable-trusted-device. should 200/ DEVICE_HAS_BEEN_TRUSTED', async () => {
    mockAxios.onGet().replyOnce(200, { data: orchestrationParameters.handler.onboardingData });
    mockAxios.onPost().replyOnce(200, { data: null });
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      mobileNumber: orchestrationParameters.handler.user.username,
      authUserId: orchestrationParameters.handler.user.id,
      deviceId: orchestrationParameters.handler.device.mobileInstanceId,
    });
    const request = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        deviceId: orchestrationParameters.handler.device.mobileInstanceId,
      },
    });
    const response = await disableTrustedDevice(request);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
    expect(data.data).toBe('DEVICE_HAS_BEEN_UNTRUSTED');
  });
});
