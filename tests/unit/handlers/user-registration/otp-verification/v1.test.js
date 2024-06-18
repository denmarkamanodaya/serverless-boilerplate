const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { userRegistrationParameters } = require('../../../../fixtures/user-registration-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const { Devices, Users } = require('../../../../../src/models/index');
const { drop, seed, sync } = require('../../../../utils/base-sync');
const axios = require('axios').default;
const AxiosMockAdapter = require('axios-mock-adapter');
const moment = require('moment');

let mockAxios = new AxiosMockAdapter(axios);
const kmsMock = mockClient(KMSClient);
const dynamoMock = mockClient(DynamoDBClient);
let otpVerification;
let ddbOtpData;
let ddbCounterData;

describe('User Registration Handler', () => {
  beforeAll(async () => {
    await sync();
    await seed('Users', userRegistrationParameters.handler.user);
  });

  afterAll(async () => {
    await drop();
  });

  beforeEach(async () => {
    kmsMock.reset();
    dynamoMock.reset();
    mockAxios.reset();
    ddbCounterData = structuredClone({
      dataset: 'dataset',
      sort_key: 'sortkey',
      invalid_otp_count: '0',
      is_locked: false,
      locked_until: null,
      created_at: null,
      updated_at: null,
    });
    ddbOtpData = structuredClone({
      dataset: 'dataset',
      sort_key: 'sortkey',
      purpose: 'purpose',
      otp: 'otp',
      is_used: false,
      duration: null,
      country_code: null,
      transaction_id: null,
      mfa_token: null,
      validity_until: null,
      created_at: null,
      updated_at: null,
    });
    otpVerification = require('../../../../../src/handlers/user-registration/otp-verification/v1').handler;
  });

  test('POST /user-registration/otp-verification. Should error when body is empty', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: {},
    });
    const response = await otpVerification(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe(
      '"countryCode" is required. "mobileNumber" is required. "otp" is required. "token" is required'
    );
  });

  test('POST /user-registration/otp-verification. Should error return first SOFT_LOCK', async () => {
    ddbCounterData.invalid_otp_count = 3;
    ddbCounterData.is_locked = true;
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbCounterData });
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: userRegistrationParameters.handler.otpVerification,
    });
    const response = await otpVerification(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('SOFT_LOCK');
  });

  test('POST /user-registration/otp-verification. Should error return SOFT_LOCK via counter', async () => {
    ddbCounterData.invalid_otp_count = 3;
    ddbCounterData.is_locked = false;
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbCounterData }).resolvesOnce({ Item: null });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: userRegistrationParameters.handler.otpVerification,
    });
    const response = await otpVerification(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('SOFT_LOCK');
  });

  test('POST /user-registration/otp-verification. Should error when no DDB data > OTP_INVALID + increase OTP counter', async () => {
    ddbCounterData.invalid_otp_count = 1;
    ddbCounterData.is_locked = false;
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbCounterData }).resolvesOnce({ Item: null });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: userRegistrationParameters.handler.otpVerification,
    });
    const response = await otpVerification(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('OTP_INVALID');
  });

  test('POST /user-registration/otp-verification. Should initially increase OTP counter from 0', async () => {
    dynamoMock.on(GetCommand).resolvesOnce({ Item: null }).resolvesOnce({ Item: null });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: userRegistrationParameters.handler.otpVerification,
    });
    const response = await otpVerification(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('OTP_INVALID');
  });

  test('POST /user-registration/otp-verification. 200', async () => {
    ddbCounterData.invalid_otp_count = 1;
    ddbCounterData.is_locked = false;
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbCounterData }).resolvesOnce({ Item: ddbOtpData });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });

    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });

    dynamoMock.on(PutCommand).resolves({ Attributes: {} });

    const requestBody = event({
      method: 'POST',
      headers: {},
      body: userRegistrationParameters.handler.otpVerification,
    });
    const response = await otpVerification(requestBody);
    const data = JSON.parse(response.body);
    expect(data).toMatchObject({
      status: httpStatus.OK,
      requestId: expect.any(String),
      code: 'VALID',
      data: {
        oneTimeToken: expect.any(String),
      },
    });
  });

  test('POST /user-registration/otp-verification. Valid for reset', async () => {
    ddbCounterData.locked_until = moment().subtract(3600, 'seconds').format();
    ddbCounterData.invalid_otp_count = 0;
    ddbCounterData.is_locked = false;

    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbCounterData }).resolvesOnce({ Item: ddbOtpData });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });

    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });

    dynamoMock.on(PutCommand).resolves({ Attributes: {} });

    const requestBody = event({
      method: 'POST',
      headers: {},
      body: userRegistrationParameters.handler.otpVerification,
    });
    const response = await otpVerification(requestBody);
    const data = JSON.parse(response.body);
    expect(data).toMatchObject({
      status: httpStatus.OK,
      requestId: expect.any(String),
      code: 'VALID',
      data: {
        oneTimeToken: expect.any(String),
      },
    });
  });
});
