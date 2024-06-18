const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { userRegistrationParameters } = require('../../../../fixtures/user-registration-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const { Devices, Users } = require('../../../../../src/models/index');
const { drop, seed, sync } = require('../../../../utils/base-sync');
const axios = require('axios').default;
const AxiosMockAdapter = require('axios-mock-adapter');

let mockAxios = new AxiosMockAdapter(axios);
const kmsMock = mockClient(KMSClient);
const dynamoMock = mockClient(DynamoDBClient);
let mobileVerification;
let ddbOtpData;

describe('User Registration Handler', () => {
  beforeAll(async () => {
    await sync();
    await seed('Users', userRegistrationParameters.handler.user);
    // await seed('Devices', userRegistrationParameters.handler.device);
  });

  afterAll(async () => {
    await drop();
  });

  beforeEach(async () => {
    kmsMock.reset();
    dynamoMock.reset();
    mockAxios.reset();
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
    mobileVerification = require('../../../../../src/handlers/user-registration/mobile-verification/v1').handler;
  });

  test('POST /user-registration/mobile-verification when body is empty', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: {},
    });
    const response = await mobileVerification(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('"countryCode" is required. "mobileNumber" is required');
  });

  test('POST /user-registration/mobile-verification kyc check failed', async () => {
    mockAxios.onPost().reply(500);
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: userRegistrationParameters.handler.mobileVerification,
    });
    const response = await mobileVerification(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    expect(data.data.message).toBe("Cannot read properties of undefined (reading 'data')");
  });

  test('POST /user-registration/mobile-verification. User exist / USER_CONFLICT', async () => {
    mockAxios.onPost().reply(200);
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: userRegistrationParameters.handler.mobileVerification,
    });
    const { countryCode, mobileNumber } = userRegistrationParameters.handler.mobileVerification;
    const formattedUsername = `${countryCode}${mobileNumber}`;
    const getUsersData = await Users.findOne({ where: { username: `${countryCode}${mobileNumber}` } });
    const response = await mobileVerification(requestBody);
    const data = JSON.parse(response.body);
    expect(getUsersData.username).toBe(formattedUsername);
    expect(data).toMatchObject({
      status: 409,
      code: 'USER_EXIST',
      data: expect.any(Object),
    });
  });

  test('POST /user-registration/mobile-verification. 500', async () => {
    mockAxios.onPost().reply(409, { data: { response: { data: { message: 'error' } }, message: 'error', code: 409 } });
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: {
        countryCode: '63',
        mobileNumber: '9100000139',
      },
    });
    const response = await mobileVerification(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    expect(data.data.message).toBe('error');
  });

  test('POST /user-registration/mobile-verification. 200', async () => {
    mockAxios.onPost().reply(200);
    dynamoMock.on(PutCommand).resolvesOnce({ Item: ddbOtpData });
    mockAxios.onPost().reply(200);
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: {
        countryCode: '63',
        mobileNumber: '9100000139',
      },
    });
    await Users.destroy({ where: { username: '639100000139' } });
    const response = await mobileVerification(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
    expect(data.code).toBe('VALID');
  });
});
