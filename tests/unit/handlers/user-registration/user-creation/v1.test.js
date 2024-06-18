const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand, GenerateRandomCommand } = require('@aws-sdk/client-kms');
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

let mockAxios = new AxiosMockAdapter(axios);
const kmsMock = mockClient(KMSClient);
const dynamoMock = mockClient(DynamoDBClient);
let userCreation;
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
      is_valid: 'true',
      is_used: false,
      duration: null,
      country_code: null,
      transaction_id: null,
      mfa_token: null,
      validity_until: null,
      created_at: null,
      updated_at: null,
    });
    userCreation = require('../../../../../src/handlers/user-registration/user-creation/v1').handler;
  });

  test('POST /user-registration/user-creation. Should error when body is empty', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: {},
    });
    const response = await userCreation(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe(
      '"countryCode" is required. "mobileNumber" is required. "username" is required. "password" is required. "oneTimeToken" is required'
    );
  });

  test('POST /user-registration/user-creation. Should error when DDB Item is empty / JWT_INVALID', async () => {
    dynamoMock.on(GetCommand).resolves({ Item: {} });
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: userRegistrationParameters.handler.userCreationConflict,
    });
    const response = await userCreation(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('JWT_INVALID');
  });

  test('POST /user-registration/user-creation. Should error when USER_EXISTS / CONFLICT', async () => {
    dynamoMock.on(PutCommand).resolves({ Item: ddbOtpData });
    dynamoMock.on(GetCommand).resolves({ Item: ddbOtpData });
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: userRegistrationParameters.handler.userCreationConflict,
    });
    const response = await userCreation(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.CONFLICT);
    expect(data.data.message).toBe('USER_EXIST');
  });

  test('POST /user-registration/user-creation. 200', async () => {
    dynamoMock.on(PutCommand).resolves({ Item: ddbOtpData });
    dynamoMock.on(GetCommand).resolves({ Item: ddbOtpData });
    dynamoMock.on(UpdateCommand).resolves({ Item: ddbOtpData });

    kmsMock.on(GenerateRandomCommand).resolvesOnce({ Plaintext: 'random-salt' });

    const requestBody = event({
      method: 'POST',
      headers: {},
      body: userRegistrationParameters.handler.userCreationSuccess,
    });

    await Users.destroy({ where: { username: userRegistrationParameters.handler.userCreationSuccess.username } });

    const response = await userCreation(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
  });
});
