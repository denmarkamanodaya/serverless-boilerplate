const { requestPasswordResetData, mobileNumberDoestNotExists, getCustomerByMobileResponse, getCustomerByMobileResponseWithoutCID } = require('../../../../fixtures/password-fixtures');
const { Users } = require('../../../../../src/models/index');
const { userA } = require('../../../../fixtures/auth-service-db');
const { drop, seed, sync } = require('../../../../utils/base-sync');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const axios = require('axios').default;
const AxiosMockAdapter = require('axios-mock-adapter');
let mockAxios = new AxiosMockAdapter(axios);
const dynamoMock = mockClient(DynamoDBClient);
let handler;
describe('Request Password Reset', () => {
  beforeAll(async () => {
    await sync();
    userA.username = '639150626709';
    userA.isActive = false;
    await seed('Users', userA);
  });
  afterAll(async () => {
    await drop();
  });
  beforeEach(() => {
    mockAxios.reset();
    dynamoMock.reset();
    handler = require('../../../../../src/handlers/password/request-password-reset/v1').handler;
  });
  test('should catch error calling onboarding svc', async () => {
    mockAxios.onGet().replyOnce(500, mobileNumberDoestNotExists);
    const requestBody = event(requestPasswordResetData);
    const responseHandler = await handler(requestBody);
    const responseObj = JSON.parse(responseHandler.body);
    expect(responseObj).toMatchObject({
      status: 500,
      code: 'DATA_PROCESSING_ERROR',
      data: expect.any(Object),
    });
  });

  test('should checked if not exist in onboarding and users table', async () => {
    requestPasswordResetData.body.mobileNumber = '639923709893';
    requestPasswordResetData.method = 'POST';
    const { mobileNumber: username } = requestPasswordResetData.body;
    mockAxios.onGet().replyOnce(200, { mobileNumber: username });
    const requestBody = event(requestPasswordResetData);
    const responseHandler = await handler(requestBody);
    const responseObj = JSON.parse(responseHandler.body);
    const getUsersData = await Users.findOne({ where: { username } });

    expect(getUsersData).toBeNull();
    expect(responseObj).toMatchObject({
      status: 400,
      code: 'USER_DOES_NOT_EXIST',
      data: expect.any(Object),
    });
  });

  test('should check user is locked', async () => {
    requestPasswordResetData.body.mobileNumber = '639150626709';
    const { mobileNumber: username } = requestPasswordResetData.body;
    mockAxios.onGet().replyOnce(200);
    const requestBody = event(requestPasswordResetData);
    const responseHandler = await handler(requestBody);
    const responseObj = JSON.parse(responseHandler.body);
    const getUsersData = await Users.findOne({ where: { username } });
    expect(getUsersData.isActive).toBeFalsy();
    expect(responseObj).toMatchObject({
      status: 423,
      code: 'USER_LOCKED',
      data: expect.any(Object),
    });
  });

  test('should send data to fraud monitoring service and catch error', async() => {
    requestPasswordResetData.body.mobileNumber = '639087621329';
    mockAxios.onGet().replyOnce(200, getCustomerByMobileResponse);
    mockAxios.onPost().reply(200);
    const requestBody = event(requestPasswordResetData);
    const responseHandler = await handler(requestBody);
    const responseObj = JSON.parse(responseHandler.body);
    expect(responseObj).toMatchObject({
      status: 401,
      code: 'TMX_DENY',
      data: expect.any(Object),
    });
  });

  test('should catch error generating otp', async() => {
    requestPasswordResetData.body.mobileNumber = '639087621329';
    mockAxios.onGet().replyOnce(200, getCustomerByMobileResponse);
    dynamoMock.on(PutCommand).resolvesOnce({ Attributes: {} });
    mockAxios.onPost().reply(500);
    const requestBody = event(requestPasswordResetData);
    const responseHandler = await handler(requestBody);
    const responseObj = JSON.parse(responseHandler.body);
    expect(responseObj).toMatchObject({
      status: 500,
      code: 'DATA_PROCESSING_ERROR',
      data: expect.any(Object),
    });
  });

  test('should should return token successfully', async() => {
    requestPasswordResetData.body.mobileNumber = '639087621329';
    mockAxios.onGet().replyOnce(200, getCustomerByMobileResponseWithoutCID);
    dynamoMock.on(PutCommand).resolvesOnce({ Attributes: {} });
    mockAxios.onPost().reply(200);
    const requestBody = event(requestPasswordResetData);
    const responseHandler = await handler(requestBody);
    const responseObj = JSON.parse(responseHandler.body);
    expect(responseObj).toMatchObject({
      status: 200,
      code: 'VALID',
      data: expect.any(Object),
    });
  });
});
