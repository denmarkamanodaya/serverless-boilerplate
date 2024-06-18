process.env.PASSWORD_CONFIG_DIGEST = 'sha512';
process.env.PASSWORD_CONFIG_ITERATIONS = 10000;
process.env.PASSWORD_CONFIG_KEY_LENGTH = 64;
process.env.FAILED_LOGIN_CONFIG_MAX_ATTEMPTS = 3;
process.env.FAILED_LOGIN_CONFIG_LOCKOUT_DURATION = 120;

const moment = require('moment');
const { KMSClient, SignCommand } = require('@aws-sdk/client-kms');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const AxiosMockAdapter = require('axios-mock-adapter');
const { randomUUID, pbkdf2Sync } = require('crypto');
const { Users, Devices } = require('../../../../src/models/index');
const { userA, deviceA } = require('../../../fixtures/auth-service-db');
const { drop, seed, sync } = require('../../../utils/base-sync');
const context = require('../../../utils/lambda-context');
const { GetCommand, UpdateCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const axios = require('axios').default;

const kmsMock = mockClient(KMSClient);
const dynamoMock = mockClient(DynamoDBClient);
const mockAxios = new AxiosMockAdapter(axios);
let eventData;
let handler;
let userId;
let deviceId;
let onboardingData;

describe('handler-login-v6', () => {
  beforeAll(async () => {
    const { PASSWORD_CONFIG_DIGEST, PASSWORD_CONFIG_ITERATIONS, PASSWORD_CONFIG_KEY_LENGTH } = process.env;
    userId = randomUUID();
    deviceId = randomUUID();
    await sync();
    userA.username = 'username';
    userA.salt = 'salt';
    userA.password = pbkdf2Sync(
      'thisismypassword',
      'salt',
      +PASSWORD_CONFIG_ITERATIONS,
      +PASSWORD_CONFIG_KEY_LENGTH,
      PASSWORD_CONFIG_DIGEST
    ).toString('hex');
    userA.id = userId;
    deviceA.id = deviceId;
    await seed('Users', userA);
    await seed('Devices', deviceA);
  });

  afterAll(async () => {
    await drop();
  });

  beforeEach(() => {
    dynamoMock.reset();
    kmsMock.reset();
    mockAxios.reset();
    eventData = structuredClone(context().event);
    onboardingData = structuredClone({
      data: {
        id: randomUUID(),
        cid: randomUUID(),
      },
    });
    handler = require('../../../../src/handlers/login/v6').handler;
  });

  test('should throw an error when user does not exist in users table', async () => {
    eventData.body = JSON.stringify({ username: 'notvalid', password: 'password' });
    eventData.headers = { ...eventData.headers, 'x-ud-device-id': 'test', 'x-ud-device-make-model': 'test' };
    const response = await handler(eventData);
    const body = JSON.parse(response.body);
    console.log(body);
    expect(body).toMatchObject({
      status: 404,
      requestId: expect.any(String),
      code: 'ERROR_PROCESSING',
      data: {
        message: 'ERROR_PROCESSING',
      },
    });
  });

  test('should throw an error when user is not active', async () => {
    mockAxios.onPost().replyOnce(400);
    eventData.body = JSON.stringify({ username: 'username', password: 'password' });
    eventData.headers = { ...eventData.headers, 'x-ud-device-id': 'test', 'x-ud-device-make-model': 'test' };
    await Users.update({ isActive: false }, { where: { id: userId } });
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 423,
      requestId: expect.any(String),
      code: 'ERROR_PROCESSING',
      data: {
        message: 'ERROR_PROCESSING',
      },
    });
  });

  test('should throw an error when user is not active', async () => {
    eventData.body = JSON.stringify({ username: 'username', password: 'password' });
    eventData.headers = { ...eventData.headers, 'x-ud-device-id': 'test', 'x-ud-device-make-model': 'test' };
    await Users.update({ salt: null, isActive: true }, { where: { id: userId } });
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 404,
      requestId: expect.any(String),
      code: 'ERROR_PROCESSING',
      data: {
        message: 'ERROR_PROCESSING',
      },
    });
  });

  test('should throw an error when password is not valid', async () => {
    mockAxios.onGet().replyOnce(400);
    dynamoMock.on(GetCommand).resolvesOnce({
      Item: {
        dataset: 'dataset',
        sort_key: 'sortkey',
        counter: 0,
      },
    });
    dynamoMock.on(UpdateCommand).resolvesOnce({ Attributes: {} });
    eventData.body = JSON.stringify({ username: 'username', password: 'password' });
    eventData.headers = { ...eventData.headers, 'x-ud-device-id': 'test', 'x-ud-device-make-model': 'test' };
    await Users.update({ salt: userA.salt, isActive: true }, { where: { id: userId } });
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'ERROR_PROCESSING',
      data: {
        message: 'ERROR_PROCESSING',
      },
    });
  });

  test('should create ddb counter record on failed login', async () => {
    mockAxios.onGet().replyOnce(400);
    dynamoMock.on(GetCommand).resolvesOnce({ Item: null });
    dynamoMock.on(PutCommand).resolvesOnce({ Attributes: {} });
    eventData.body = JSON.stringify({ username: 'username', password: 'password' });
    eventData.headers = { ...eventData.headers, 'x-ud-device-id': 'test', 'x-ud-device-make-model': 'test' };
    await Users.update({ salt: userA.salt, isActive: true }, { where: { id: userId } });
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'ERROR_PROCESSING',
      data: {
        message: 'ERROR_PROCESSING',
      },
    });
  });

  test('should throw an error on max login attempts', async () => {
    mockAxios.onGet().replyOnce(400);
    dynamoMock.on(GetCommand).resolvesOnce({
      Item: {
        dataset: 'dataset',
        sort_key: 'sortkey',
        counter: 2,
      },
    });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });
    eventData.body = JSON.stringify({ username: 'username', password: 'password' });
    eventData.headers = { ...eventData.headers, 'x-ud-device-id': 'test', 'x-ud-device-make-model': 'test' };
    await Users.update({ salt: userA.salt, isActive: true }, { where: { id: userId } });
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 403,
      requestId: expect.any(String),
      code: 'LOGIN_MAX_ATTEMPTS',
      data: {
        message: expect.any(String),
      },
    });
  });

  test('should throw an error when password is not valid and onboarding data is existing', async () => {
    mockAxios.onGet().replyOnce(200, onboardingData);
    mockAxios.onPost().replyOnce(400);
    dynamoMock.on(GetCommand).resolvesOnce({
      Item: {
        dataset: 'dataset',
        sort_key: 'sortkey',
        counter: 0,
        lock_duration_seconds: 120,
        lock_duration_datetime: moment().add(120, 'seconds').format(),
      },
    });
    dynamoMock.on(UpdateCommand).resolvesOnce({ Attributes: {} });
    eventData.body = JSON.stringify({ username: 'username', password: 'password' });
    eventData.headers = { ...eventData.headers, 'x-ud-device-id': 'test', 'x-ud-device-make-model': 'test' };
    await Users.update({ salt: userA.salt, isActive: true }, { where: { id: userId } });
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'ERROR_PROCESSING',
      data: {
        message: 'ERROR_PROCESSING',
      },
    });
  });

  test('should migrate the user when customer id is not equal to membership id in user db', async () => {
    mockAxios.onGet().replyOnce(200, { data: { id: 'randomid' } });
    dynamoMock.on(GetCommand).resolvesOnce({
      Item: {
        dataset: 'dataset',
        sort_key: 'sort_key',
        counter: 0,
        lock_duration_seconds: null,
        lock_duration_datetime: null,
        created_at: null,
        updated_at: null,
      },
    });
    dynamoMock.on(UpdateCommand).resolvesOnce({ Attributes: {} });
    eventData.body = JSON.stringify({
      username: 'username',
      password: 'thisismypassword',
    });
    eventData.headers = {
      ...eventData.headers,
      'x-ud-device-id': '56bdbeb7d526b52e09f1ec324abe1500a2dbb066eb1eb8c9699789e1960c6a08',
      'x-ud-device-make-model': 'test',
    };
    await Devices.update({ trusted: 1 }, { where: { id: deviceId } });
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'ERROR_PROCESSING',
      data: {
        message: 'ERROR_PROCESSING',
      },
    });
  });

  test('should return an error when device is not owned', async () => {
    mockAxios.onGet().replyOnce(400);
    dynamoMock.on(GetCommand).resolvesOnce({
      Item: {
        dataset: 'dataset',
        sort_key: 'sort_key',
        counter: 0,
        lock_duration_seconds: null,
        lock_duration_datetime: null,
        created_at: null,
        updated_at: null,
      },
    });
    dynamoMock.on(UpdateCommand).resolvesOnce({ Attributes: {} });
    eventData.body = JSON.stringify({
      username: 'username',
      password: 'thisismypassword',
    });
    eventData.headers = {
      ...eventData.headers,
      'x-ud-device-id': '56bdbeb7d526b52e09f1ec324abe1500a2dbb066eb1eb8c9699789e1960c6a08',
      'x-ud-device-make-model': 'test',
    };
    await Devices.update({ trusted: 1 }, { where: { id: deviceId } });
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'ERROR_PROCESSING',
      data: {
        message: 'ERROR_PROCESSING',
      },
    });
  });

  test('should return an error when account currently on max login attempts', async () => {
    mockAxios.onGet().replyOnce(400);
    dynamoMock.on(GetCommand).resolvesOnce({
      Item: {
        dataset: 'dataset',
        sort_key: 'sort_key',
        counter: 0,
        lock_duration_seconds: null,
        lock_duration_datetime: moment().add(120, 'seconds').format(),
        created_at: null,
        updated_at: null,
      },
    });
    dynamoMock.on(UpdateCommand).resolvesOnce({ Attributes: {} });
    eventData.body = JSON.stringify({
      username: 'username',
      password: 'thisismypassword',
    });
    eventData.headers = {
      ...eventData.headers,
      'x-ud-device-id': '56bdbeb7d526b52e09f1ec324abe1500a2dbb066eb1eb8c9699789e1960c6a08',
      'x-ud-device-make-model': 'test',
    };
    await Devices.update({ trusted: 1 }, { where: { id: deviceId } });
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 403,
      requestId: expect.any(String),
      code: 'LOGIN_MAX_ATTEMPTS',
      data: {
        message: expect.any(String),
      },
    });
  });

  test('should return an error when tmx call returns a deny response', async () => {
    mockAxios.onGet().replyOnce(200, { data: { cid: 'cid', id: 'id', customerDetails: { emailAddress: 'emailAddress' } } });
    mockAxios.onPost().replyOnce(200, { data: { disposition: 'Deny' } });
    dynamoMock.on(GetCommand).resolvesOnce({
      Item: {
        dataset: 'dataset',
        sort_key: 'sort_key',
        counter: 0,
        lock_duration_seconds: null,
        lock_duration_datetime: null,
        created_at: null,
        updated_at: null,
      },
    });
    dynamoMock.on(UpdateCommand).resolvesOnce({ Attributes: {} });
    eventData.body = JSON.stringify({
      username: 'username',
      password: 'thisismypassword',
    });
    eventData.headers = {
      ...eventData.headers,
      'x-ud-device-id': '56bdbeb7d526b52e09f1ec324abe1500a2dbb066eb1eb8c9699789e1960c6a08',
      'x-ud-device-make-model': 'test',
    };
    await Devices.update(
      { mobileInstanceId: '56bdbeb7d526b52e09f1ec324abe1500a2dbb066eb1eb8c9699789e1960c6a08', trusted: 1, userId },
      { where: { id: deviceId } }
    );
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'ERROR_PROCESSING',
      data: {
        message: 'ERROR_PROCESSING',
      },
    });
  });

  test('should return valid response', async () => {
    mockAxios.onGet().replyOnce(200, { data: { cid: 'cid', id: 'id', customerDetails: { emailAddress: 'emailAddress' } } });
    mockAxios.onPost().replyOnce(200, { data: { disposition: 'Allow' } });
    mockAxios.onPost().reply(200, { page: { size: 1 } });

    kmsMock.on(SignCommand).resolvesOnce({ Signature: 'signature' });
    dynamoMock.on(GetCommand).resolvesOnce({
      Item: {
        dataset: 'dataset',
        sort_key: 'sort_key',
        counter: 0,
        lock_duration_seconds: null,
        lock_duration_datetime: null,
        created_at: null,
        updated_at: null,
      },
    });
    dynamoMock.on(UpdateCommand).resolvesOnce({ Attributes: {} });
    eventData.body = JSON.stringify({
      username: 'username',
      password: 'thisismypassword',
    });
    eventData.headers = {
      ...eventData.headers,
      'x-ud-device-id': '56bdbeb7d526b52e09f1ec324abe1500a2dbb066eb1eb8c9699789e1960c6a08',
      'x-ud-device-make-model': 'test',
    };
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 200,
      requestId: expect.any(String),
      code: 'ACCESS_CODE_GENERATED',
      data: {
        baasToken: {
          accessToken: expect.any(String),
        },
      },
    });
  });

  test('should passthrough tmx when onboarding data is not available', async () => {
    mockAxios.onGet().replyOnce(400);
    mockAxios.onPost().replyOnce(200, { data: { disposition: 'Allow' } });
    mockAxios.onPost().reply(200, { page: { size: 1 } });

    kmsMock.on(SignCommand).resolvesOnce({ Signature: 'signature' });
    dynamoMock.on(GetCommand).resolvesOnce({
      Item: {
        dataset: 'dataset',
        sort_key: 'sort_key',
        counter: 0,
        lock_duration_seconds: null,
        lock_duration_datetime: null,
        created_at: null,
        updated_at: null,
      },
    });
    dynamoMock.on(UpdateCommand).resolvesOnce({ Attributes: {} });
    eventData.body = JSON.stringify({
      username: 'username',
      password: 'thisismypassword',
    });
    eventData.headers = {
      ...eventData.headers,
      'x-ud-device-id': '56bdbeb7d526b52e09f1ec324abe1500a2dbb066eb1eb8c9699789e1960c6a08',
      'x-ud-device-make-model': 'test',
    };
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 200,
      requestId: expect.any(String),
      code: 'ACCESS_CODE_GENERATED',
      data: {
        baasToken: {
          accessToken: expect.any(String),
        },
      },
    });
  });

  test('should passthrough tmx when call failed', async () => {
    mockAxios.onGet().replyOnce(200, { data: { cid: 'cid', id: 'id', customerDetails: { emailAddress: undefined } } });
    mockAxios.onPost().replyOnce(400);
    mockAxios.onPost().reply(200, { page: { size: 1 } });

    kmsMock.on(SignCommand).resolvesOnce({ Signature: 'signature' });
    dynamoMock.on(GetCommand).resolvesOnce({
      Item: {
        dataset: 'dataset',
        sort_key: 'sort_key',
        counter: 0,
        lock_duration_seconds: null,
        lock_duration_datetime: null,
        created_at: null,
        updated_at: null,
      },
    });
    dynamoMock.on(UpdateCommand).resolvesOnce({ Attributes: {} });
    eventData.body = JSON.stringify({
      username: 'username',
      password: 'thisismypassword',
    });
    eventData.headers = {
      ...eventData.headers,
      'x-ud-device-id': '56bdbeb7d526b52e09f1ec324abe1500a2dbb066eb1eb8c9699789e1960c6a08',
      'x-ud-device-make-model': 'test',
    };
    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 200,
      requestId: expect.any(String),
      code: 'ACCESS_CODE_GENERATED',
      data: {
        baasToken: {
          accessToken: expect.any(String),
        },
      },
    });
  });

  test('should send notification for new device', async () => {
    mockAxios.onGet().replyOnce(200, { data: { cid: 'cid', id: 'id', customerDetails: { emailAddress: undefined } } });
    mockAxios.onPost().replyOnce(400);
    mockAxios.onPost().reply(200, { page: { size: 1 } });

    kmsMock.on(SignCommand).resolvesOnce({ Signature: 'signature' });
    dynamoMock.on(GetCommand).resolvesOnce({
      Item: {
        dataset: 'dataset',
        sort_key: 'sort_key',
        counter: 0,
        lock_duration_seconds: null,
        lock_duration_datetime: null,
        created_at: null,
        updated_at: null,
      },
    });
    dynamoMock.on(UpdateCommand).resolvesOnce({ Attributes: {} });
    eventData.body = JSON.stringify({
      username: 'username',
      password: 'thisismypassword',
    });
    eventData.headers = {
      ...eventData.headers,
      'x-ud-device-id': 'newdevicerecord',
      'x-ud-device-make-model': 'test',
    };
    const response = await handler(eventData);
    const body = JSON.parse(response.body);
    console.log(await Devices.findAll());
    expect(body).toMatchObject({
      status: 200,
      requestId: expect.any(String),
      code: 'ACCESS_CODE_GENERATED',
      data: {
        baasToken: {
          accessToken: expect.any(String),
        },
      },
    });
  });
});
