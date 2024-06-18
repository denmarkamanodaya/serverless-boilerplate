const { ddbOtpNewData, constVarPassword } = require('../../../../fixtures/password-fixtures');
const { Users } = require('../../../../../src/models/index');
const { userA } = require('../../../../fixtures/auth-service-db');
const { drop, seed, sync } = require('../../../../utils/base-sync');
const { KMSClient, GenerateRandomCommand } = require('@aws-sdk/client-kms');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const { randomUUID } = require('crypto');
const event = require('../../../../utils/eventGenerator');
const axios = require('axios').default;
const AxiosMockAdapter = require('axios-mock-adapter');
let mockAxios = new AxiosMockAdapter(axios);
const dynamoMock = mockClient(DynamoDBClient);
const { generatePasswordHash } = require('../../../../../src/utils/helpers/password-helper');
let kmsMock = mockClient(KMSClient);
let handler, resetPasswordRequestBody, ddbOtpData;
describe('Reset Password', () => {
  beforeAll(async () => {
    await sync();
    userA.username = '639150626709';
    userA.password = constVarPassword.passwordHash;
    // userA.password = 'ec5723667a44234e58dadb7fe7c34cde32495969eab7cf9856ea1f8a1fba9e18a45a2feb37d7d05a168fe43f495870e197acc6a3388e56cd6243b9f673c5f9de';
    await seed('Users', userA);
    ddbOtpData = structuredClone(ddbOtpNewData);
  });
  afterAll(async () => {
    await drop();
  });
  beforeEach(() => {
    mockAxios.reset();
    dynamoMock.reset();
    kmsMock.reset();
    handler = require('../../../../../src/handlers/password/reset-password/v1').handler;
    resetPasswordRequestBody = require('../../../../fixtures/password-fixtures').resetPasswordRequestBody;
  });
  afterEach(() => {
    dynamoMock.reset();
  });
  test('should check password if valid criteria', async () => {
    resetPasswordRequestBody.body.password = 'password';
    const requestBody = event(resetPasswordRequestBody);
    const responseHandler = await handler(requestBody);
    const responseObj = JSON.parse(responseHandler.body);
    expect(responseObj).toMatchObject({
      status: 400,
      code: 'PASSWORD_CRITERIA_DOES_NOT_MATCH',
      data: expect.any(Object),
    });
  });
  test('should check if user exists', async () => {
    resetPasswordRequestBody.body.password = 'pAss@1234';
    const username = resetPasswordRequestBody.body.mobileNumber;
    const requestBody = event(resetPasswordRequestBody);
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
  test('should verify if otp is valid', async () => {
    dynamoMock.on(GetCommand).resolvesOnce({ Item: null }).resolvesOnce({ Item: ddbOtpData });
    resetPasswordRequestBody.body.mobileNumber = '639150626709';
    const requestBody = event(resetPasswordRequestBody);
    const responseHandler = await handler(requestBody);
    const responseObj = JSON.parse(responseHandler.body);
    expect(responseObj).toMatchObject({
      status: 400,
      code: 'OTP_INVALID',
      data: expect.any(Object),
    });
  });
  test('should validate new password is not same with old password', async () => {
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbOtpData });
    resetPasswordRequestBody.body.otp = '342512';
    const username = resetPasswordRequestBody.body.mobileNumber;
    const requestBody = event(resetPasswordRequestBody);
    const responseHandler = await handler(requestBody);
    const responseObj = JSON.parse(responseHandler.body);

    const getUsersData = await Users.findOne({ where: { username } });
    const generatedNewPasswordHash = await generatePasswordHash({
      salt: getUsersData.salt,
      password: resetPasswordRequestBody.body.password,
    });

    expect(getUsersData.password).toBe(generatedNewPasswordHash);

    expect(responseObj).toMatchObject({
      status: 400,
      code: 'PASSWORD_CANNOT_BE_SAME',
      data: expect.any(Object),
    });
  });
  test('should catch error updating user password', async () => {
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbOtpData });
    const username = resetPasswordRequestBody.body.mobileNumber;
    resetPasswordRequestBody.body.otp = '342512';
    await Users.update({ password: null }, { where: { username } });
    const requestBody = event(resetPasswordRequestBody);
    const responseHandler = await handler(requestBody);
    const responseObj = JSON.parse(responseHandler.body);
    expect(responseObj).toMatchObject({
      status: 400,
      code: 'DATA_PROCESSING_ERROR',
      data: expect.any(Object),
    });
  });
  test('should successfully reset password', async () => {
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbOtpData });
    const Plaintext = randomUUID();
    kmsMock.on(GenerateRandomCommand).resolves({
      Plaintext,
    });
    const username = resetPasswordRequestBody.body.mobileNumber;
    const revPassword = constVarPassword.passwordHash;
    await Users.update({ password: revPassword }, { where: { username } });
    
    resetPasswordRequestBody.body.otp = '342512';
    resetPasswordRequestBody.body.mobileNumber = '639150626709';
    resetPasswordRequestBody.body.password = 'unitTest!123';
    const requestBody = event(resetPasswordRequestBody);
    const responseHandler = await handler(requestBody);
    const responseObj = JSON.parse(responseHandler.body);

    const getUsersData = await Users.findOne({ where: { username } });
    const generatedNewPasswordHash = await generatePasswordHash({
      salt: getUsersData.salt,
      password: resetPasswordRequestBody.body.password,
    });

    expect(getUsersData.password).toBe(generatedNewPasswordHash);
    expect(responseObj).toMatchObject({
      status: 200,
      code: 'PASSWORD_RESET_SUCCESSFULLY',
      data: expect.any(Object),
    });
  });
});
