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

const kmsMock = mockClient(KMSClient);
const dynamoMock = mockClient(DynamoDBClient);
let mockAxios = new AxiosMockAdapter(axios);
let validateSmsOtp;

describe('Orchestration Handler', () => {
  beforeAll(async () => {});

  afterAll(async () => {});

  beforeEach(async () => {
    kmsMock.reset();
    dynamoMock.reset();
    mockAxios.reset();
    process.env.NODE_ENV = 'test';
    validateSmsOtp = require('../../../../../src/handlers/orchestration/validate-sms-otp/v2').handler;
  });

  test('POST /orchestration/validate-sms-otp. should error missing body', async () => {
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
    const response = await validateSmsOtp(request);
    const data = JSON.parse(response.body);
    console.log(data);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('"otp" is required. "otpId" is required');
  });

  test('POST /orchestration/validate-sms-otp. should throw OTP_INVALID', async () => {
    dynamoMock.on(GetCommand).resolvesOnce({ Item: null });
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
      body: {
        otp: '12345',
        otpId: '12345',
      },
    });
    const response = await validateSmsOtp(request);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('OTP_INVALID');
  });

  test('POST /orchestration/validate-sms-otp. 200', async () => {
    dynamoMock.on(GetCommand).resolvesOnce({ Item: { data: 'fake-data' } });
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
      body: {
        otp: '12345',
        otpId: '12345',
      },
    });
    const response = await validateSmsOtp(request);
    const data = JSON.parse(response.body);
    console.log(data);
    expect(data.status).toBe(httpStatus.OK);
  });
});
