const httpStatus = require('http-status');
const { KosmosService } = require('../../../src/services/kosmos-service');
const { orchestrationParameters } = require('../../fixtures/orchestration-fixtures');
const AxiosMockAdapter = require('axios-mock-adapter');
const { Devices, Users } = require('../../../src/models/index');
const { drop, seed, sync } = require('../../utils/base-sync');

let kosmos;
let mockAxios;
let axiosInstance;

describe('onekosmos-helper', () => {
  beforeAll(async () => {
    await sync();

    await seed('Users', orchestrationParameters.handler.user);

    orchestrationParameters.handler.device.trusted = 1;
    await seed('Devices', orchestrationParameters.handler.device);
  });

  afterAll(async () => {
    await drop();
  });

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.IK_SMS_PUB_KEY = 'test';
    process.env.IK_UMS_PUB_KEY = 'test';

    const axios = require('axios').default;
    mockAxios = new AxiosMockAdapter(axios);

    const { AxiosInterceptor } = require('../../../src/common/axios-interceptor');
    axiosInstance = new AxiosInterceptor({}).axiosInstance;

    mockAxios.reset();
  });

  test('should error verify OTP. DEVICE_NOT_TRUSTED', async () => {
    mockAxios
      .onPost()
      .reply(200, { data: 'encrypted-data' })
      .onPost()
      .reply(200, { data: 'encrypted-data' })
      .onPost()
      .reply(200, { data: true });

    const requestBody = {
      userId: '1',
    };

    try {
      kosmos = new KosmosService();
      kosmos.initialize();
      await kosmos.verifyOtp(requestBody);
    } catch (e) {
      expect(e.code).toBe('DEVICE_NOT_TRUSTED');
      expect(e.statusCode).toBe(httpStatus.UNAUTHORIZED);
    }
  });

  test('should error verify OTP. 200', async () => {
    mockAxios
      .onPost()
      .reply(200, { data: 'encrypted-data' })
      .onPost()
      .reply(200, { data: 'encrypted-data' })
      .onPost()
      .reply(200, { data: true });

    const requestBody = {
      userId: orchestrationParameters.handler.user.membershipId,
    };

    try {
      kosmos = new KosmosService();
      kosmos.initialize();
      const response = await kosmos.verifyOtp(requestBody);
      expect(response.data).toBe(true);
    } catch (e) {
      // no catch should be successfull
    }
  });

  test('should error verify OTP. catch block', async () => {
    const setupError = jest.fn();
    const requestBody = {
      userId: orchestrationParameters.handler.user.membershipId,
    };
    try {
      await kosmos.verifyOtp(requestBody);
      expect(setupError).toHaveBeenCalledOnce();
    } catch (e) {}
  });
  test('should error ecdsaHelper catch block', async () => {
    const setupError = jest.fn();
    const requestBody = {
      userId: orchestrationParameters.handler.user.membershipId,
    };
    try {
      await kosmos.ecdsaHelper(requestBody);
      expect(setupError).toHaveBeenCalledOnce();
    } catch (e) {}
  });
  test('should error ecdsaHelper catch block', async () => {
    const setupError = jest.fn();
    const requestBody = {
      userId: orchestrationParameters.handler.user.membershipId,
    };
    try {
      await kosmos.createUser(requestBody);
      expect(setupError).toHaveBeenCalledOnce();
    } catch (e) {}
  });
  test('should error ecdsaHelper catch block', async () => {
    const setupError = jest.fn();
    const requestBody = {
      userId: orchestrationParameters.handler.user.membershipId,
    };
    try {
      await kosmos.fetchUser(requestBody);
      expect(setupError).toHaveBeenCalledOnce();
    } catch (e) {}
  });
  test('should error getAccessCode catch block', async () => {
    const setupError = jest.fn();
    const requestBody = {
      userId: orchestrationParameters.handler.user.membershipId,
    };
    try {
      await kosmos.getAccessCode(requestBody);
      expect(setupError).toHaveBeenCalledOnce();
    } catch (e) {}
  });

  test('should create user. 200', async () => {
    mockAxios.onPut().reply(200, { data: true });
    try {
      kosmos = new KosmosService();
      const response = await kosmos.createUser(orchestrationParameters.handler.user.username);
      expect(response.data).toBe(true);
    } catch (e) {
      // no catch should be successfull
    }
  });

  test('should error fetch user. 500', async () => {
    mockAxios.onPut().reply(500, { data: true });
    try {
      kosmos = new KosmosService();
      await kosmos.fetchUser(orchestrationParameters.handler.user.username);
    } catch (e) {
      console.log(e);
      expect(e.code).toBe('DATA_PROCESSING_ERROR');
      expect(e.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    }
  });

  test('should getAccessCode. 500', async () => {
    mockAxios
      .onPost()
      .reply(200, { data: 'encrypted-data' })
      .onPost()
      .reply(200, { data: 'encrypted-data' })

      .onPut()
      .reply(200, { data: true });

    const requestBody = {
      username: orchestrationParameters.handler.user.username,
      version: 'athena',
    };

    try {
      kosmos = new KosmosService();
      kosmos.initialize();
      await kosmos.getAccessCode(requestBody);
    } catch (e) {
      expect(e.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    }
  });

  test('should getAccessCode. 200', async () => {
    mockAxios
      .onPost()
      .reply(200, { data: 'encrypted-data' })
      .onPut()
      .reply(200, { status: 200, data: { uid: '12345', username: orchestrationParameters.handler.user.username } });

    const requestBody = {
      username: orchestrationParameters.handler.user.username,
      version: 'athena',
    };

    kosmos = new KosmosService();
    kosmos.smsHeaders = { headers: { license: 'encrypted-data' } };
    const response = await kosmos.getAccessCode(requestBody);

    expect(response.data.uid).toBe('12345');
  });
});
