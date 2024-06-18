const {
  getOneKosmosUser,
  isOneKosmosUserExists,
  createOneKosmosUser,
  getAccessCode,
} = require('../../../../src/utils/helpers/onekosmos-helper');
const { orchestrationParameters } = require('../../../fixtures/orchestration-fixtures');
const axios = require('axios').default;
const AxiosMockAdapter = require('axios-mock-adapter');

let mockAxios = new AxiosMockAdapter(axios);

describe('onekosmos-helper', () => {
  beforeAll(async () => {});

  afterAll(async () => {});

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.IK_SMS_PUB_KEY = 'test';
    process.env.IK_UMS_PUB_KEY = 'test';
    mockAxios.reset();
  });

  test('should get 1Kosmos User', async () => {
    mockAxios
      .onPost()
      .reply(200, { data: { data: 'encrypted-data' } })
      .onPost()
      .reply(200, { data: { data: 'encrypted-data' } })
      .onPost()
      .reply(200, { data: { uid: '12345', username: 'username', mobileNumber: 'username' } });

    const response = await getOneKosmosUser({ username: orchestrationParameters.handler.user.username });

    expect(response.data).toMatchObject({
      uid: expect.any(String),
      username: expect.any(String),
      mobileNumber: expect.any(String),
    });
  });

  test('should check 1Kosmos user if exists', async () => {
    mockAxios
      .onPost()
      .reply(200, { data: { data: 'encrypted-data' } })
      .onPost()
      .reply(200, { data: { data: 'encrypted-data' } })
      .onPost()
      .reply(200, { page: { size: 0 } });

    const response = await isOneKosmosUserExists({ username: orchestrationParameters.handler.user.username });

    expect(response).toBe(false);
  });

  test('should create 1Kosmos user', async () => {
    mockAxios
      .onPost()
      .reply(200, { data: { data: 'encrypted-data' } })
      .onPost()
      .reply(200, { data: { data: 'encrypted-data' } })
      .onPost()
      .reply(200, { page: { size: 0 } })
      .onPut()
      .reply(200, { data: { message: 'successfully created' } });

    const response = await createOneKosmosUser({ username: orchestrationParameters.handler.user.username });

    expect(response).toBe(true);
  });

  test('should error creating 1Kosmos user', async () => {
    mockAxios
      .onPost()
      .reply(200, { data: { data: 'encrypted-data' } })
      .onPost()
      .reply(200, { data: { data: 'encrypted-data' } })
      .onPost()
      .reply(200, { page: { size: 1 } });

    const response = await createOneKosmosUser({ username: orchestrationParameters.handler.user.username });

    expect(response).toBe(false);
  });

  test('should get 1Kosmos User', async () => {
    mockAxios
      .onPost()
      .reply(200, { data: { data: 'encrypted-data' } })
      .onPost()
      .reply(200, { data: { data: 'encrypted-data' } })
      .onPut()
      .reply(200, { data: { uid: '12345', code: '12345', accessLink: 'test' } });

    const response = await getAccessCode({ username: orchestrationParameters.handler.user.username });

    expect(response.data).toMatchObject({
      uid: expect.any(String),
      code: expect.any(String),
      accessLink: expect.any(String),
    });
  });
});
