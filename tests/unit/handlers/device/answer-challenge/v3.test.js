const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { deviceEnrollmentParameters } = require('../../../../fixtures/device-enrollment-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const { Devices, Users } = require('../../../../../src/models/index');
const { drop, seed, sync } = require('../../../../utils/base-sync');

const kmsMock = mockClient(KMSClient);
const dynamoMock = mockClient(DynamoDBClient);
let answerChallengeHandler;

describe('Device Enrollment Handler', () => {
  beforeAll(async () => {
    await sync();
    await seed('Users', deviceEnrollmentParameters.handler.user);
    await seed('Devices', deviceEnrollmentParameters.handler.device);
  });

  afterAll(async () => {
    await drop();
  });

  beforeEach(async () => {
    kmsMock.reset();
    dynamoMock.reset();
    answerChallengeHandler = require('../../../../../src/handlers/device/answer-challenge/v3').handler;
  });

  test('POST /device/answer-challenge when Headers are empty', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: deviceEnrollmentParameters.handler.failed,
    });
    const response = await answerChallengeHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('"authorization" is required. "x-device-enrollment-token" is required');
  });
  test('POST /device/answer-challenge when JWT_INVALID', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: deviceEnrollmentParameters.handler.headers.authorization,
        'x-device-enrollment-token': deviceEnrollmentParameters.handler.headers.authorization,
      },
      body: deviceEnrollmentParameters.handler.body.otp,
    });
    const response = await answerChallengeHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('JWT_INVALID');
  });
  test('POST /device/answer-challenge otp is empty', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: deviceEnrollmentParameters.handler.headers.authorization,
        'x-device-enrollment-token': deviceEnrollmentParameters.handler.headers.authorization,
      },
      body: {
        otp: '',
        otpId: '123456',
      },
    });
    const response = await answerChallengeHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('"otp" is not allowed to be empty');
  });
  test('POST /device/answer-challenge otpId is empty', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: deviceEnrollmentParameters.handler.headers.authorization,
        'x-device-enrollment-token': deviceEnrollmentParameters.handler.headers.authorization,
      },
      body: {
        otp: '123456',
        otpId: '',
      },
    });
    const response = await answerChallengeHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('"otpId" is not allowed to be empty');
  });

  test('POST /device/answer-challenge enrollment token is invalid', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({ data: 'data' });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-device-enrollment-token': deviceEnrollmentParameters.handler.token,
      },
      body: deviceEnrollmentParameters.handler.body.otp,
    });
    const response = await answerChallengeHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('JWT_INVALID');
  });
  test('POST /device/answer-challenge enrollment TOKEN_MISMATCH', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      deviceId: '1234567',
      authUserId: '1234567',
      mobileNumber: '1234567',
    });
    const token2 = await sign({
      deviceId: '123456',
      authUserId: '123456',
      mobileNumber: '123456',
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-device-enrollment-token': token2,
      },
      body: deviceEnrollmentParameters.handler.body.otp,
    });
    const response = await answerChallengeHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('TOKEN_MISMATCH');
  });

  test('POST /device/answer-challenge otp invalid', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    dynamoMock.on(GetCommand).resolves({ Item: null });
    const token = await sign({ data: 'data' });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-device-enrollment-token': token,
      },
      body: deviceEnrollmentParameters.handler.body.otp,
    });
    const response = await answerChallengeHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('OTP_INVALID');
  });

  test('should return valid response when otp is existing', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    dynamoMock.on(GetCommand).resolves({ Item: {} });
    const token = await sign({
      authUserId: deviceEnrollmentParameters.handler.device.userId,
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-device-enrollment-token': token,
      },
      body: deviceEnrollmentParameters.handler.body.otp,
    });
    const response = await answerChallengeHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
    expect(data.code).toBe('VALID');
  });
});
