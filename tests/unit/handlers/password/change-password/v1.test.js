const { constVarPassword } = require('../../../../fixtures/password-fixtures');
const { Users } = require('../../../../../src/models/index');
const { userA } = require('../../../../fixtures/auth-service-db');
const { drop, seed, sync } = require('../../../../utils/base-sync');
const event = require('../../../../utils/eventGenerator');
const { KMSClient, GenerateRandomCommand } = require('@aws-sdk/client-kms');
const { mockClient } = require('aws-sdk-client-mock');
const { randomUUID } = require('crypto');
const { generatePasswordHash } = require('../../../../../src/utils/helpers/password-helper');
let kmsMock = mockClient(KMSClient);
let handler, changePasswordRequestBody;
describe('Change Password', () => {
  beforeAll(async () => {
    await sync();
    userA.username = '639150626709';
    userA.password = constVarPassword.passwordHash;
    await seed('Users', userA);
  });
  afterAll(async () => {
    await drop();
  });
  beforeEach(() => {
    kmsMock.reset();
    handler = require('../../../../../src/handlers/password/change-password/v1').handler;
    changePasswordRequestBody = require('../../../../fixtures/password-fixtures').changePasswordRequestBody;
  });

  test('should check if user exists', async () => {
    const username = changePasswordRequestBody.body.username;
    const requestBody = event(changePasswordRequestBody);
    const responseHandler = await handler(requestBody);
    const getUsersData = await Users.findOne({ where: { username } });

    const responseObj = JSON.parse(responseHandler.body);
    expect(getUsersData).toBeNull();
    expect(responseObj).toMatchObject({
      status: 400,
      code: 'USER_DOES_NOT_EXIST',
      data: expect.any(Object),
    });
  });

  test('should validate current password is same as saved password', async () => {
    changePasswordRequestBody.body.username = '639150626709';
    const username = changePasswordRequestBody.body.username;
    const requestBody = event(changePasswordRequestBody);
    const responseHandler = await handler(requestBody);
    const responseObj = JSON.parse(responseHandler.body);

    const getUsersData = await Users.findOne({ where: { username } });
    const generatedPasswordHash = await generatePasswordHash({
      salt: getUsersData.salt,
      password: changePasswordRequestBody.body.password,
    });
    expect(getUsersData.password).not.toBe(generatedPasswordHash);
    expect(responseObj).toMatchObject({
      status: 400,
      code: 'PASSWORD_DO_NOT_MATCH',
      data: expect.any(Object),
    });
  });

  test('should validate current password is same with new password', async () => {
    changePasswordRequestBody.body.password = 'pAss@1234';
    const requestBody = event(changePasswordRequestBody);
    const { password, newPassword } = changePasswordRequestBody.body;
    const responseHandler = await handler(requestBody);

    const responseObj = JSON.parse(responseHandler.body);
    expect(password).toBe(newPassword);
    expect(responseObj).toMatchObject({
      status: 400,
      code: 'PASSWORD_CANNOT_BE_SAME',
      data: expect.any(Object),
    });
  });

  test('should validate new password if valid to criteria', async () => {
    changePasswordRequestBody.body.newPassword = 'oldpassword';
    const requestBody = event(changePasswordRequestBody);
    const responseHandler = await handler(requestBody);

    const responseObj = JSON.parse(responseHandler.body);
    expect(responseObj).toMatchObject({
      status: 400,
      code: 'PASSWORD_CRITERIA_DOES_NOT_MATCH',
      data: expect.any(Object),
    });
  });

  test('should catch error updating password', async () => {
    changePasswordRequestBody.body.newPassword = 'unitTest!123';
    const requestBody = event(changePasswordRequestBody);
    const responseHandler = await handler(requestBody);

    const responseObj = JSON.parse(responseHandler.body);
    expect(responseObj).toMatchObject({
      status: 400,
      code: 'DATA_PROCESSING_ERROR',
      data: expect.any(Object),
    });
  });

  test('should update new password successfully', async () => {
    const Plaintext = randomUUID();
    kmsMock.on(GenerateRandomCommand).resolves({
      Plaintext,
    });
    const username = changePasswordRequestBody.body.username;
    const requestBody = event(changePasswordRequestBody);
    const responseHandler = await handler(requestBody);

    const responseObj = JSON.parse(responseHandler.body);
    const getUsersData = await Users.findOne({ where: { username } });
    const generatedNewPasswordHash = await generatePasswordHash({
      salt: getUsersData.salt,
      password: changePasswordRequestBody.body.newPassword,
    });
    expect(getUsersData.password).toBe(generatedNewPasswordHash);
    expect(responseObj).toMatchObject({
      status: 200,
      code: 'PASSWORD_CHANGE_SUCCESSFULLY',
      data: expect.any(Object),
    });
  });
});
