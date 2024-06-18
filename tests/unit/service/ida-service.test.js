const AxiosMockAdapter = require('axios-mock-adapter');
const { UdIdaService } = require('../../../src/services/ida-service/ida-service');
const { idaParameters } = require('../../fixtures/ida-service-fixtures');

let ida;

describe('ida-service', () => {
  beforeAll(async () => {});

  afterAll(async () => {});

  beforeEach(() => {
    const axios = require('axios').default;
    mockAxios = new AxiosMockAdapter(axios);

    const { AxiosInterceptor } = require('../../../src/common/axios-interceptor');
    axiosInstance = new AxiosInterceptor({}).axiosInstance;

    ida = new UdIdaService();
  });

  test('Should error session does not exists', async () => {
    const response = await ida.getDeviceInfo(idaParameters.mobileNumber);
    expect(response.isSessionExist).toBe(false);
    expect(response.makeModel).toBe(null);
  });

  test('Should error session if id is empty', async () => {
    const response = await ida.getDeviceInfo(null);
    expect(response.isSessionExist).toBe(false);
    expect(response.makeModel).toBe(null);
  });

  test('Should get device info', async () => {
    mockAxios.onGet().reply(200, idaParameters.deviceData);
    const response = await ida.getDeviceInfo(idaParameters.mobileNumber);
    expect(response.isSessionExist).toBe(true);
    expect(response.makeModel).toBe('Nokia-3210');
  });

  test('Should error user does not exists normal format', async () => {
    mockAxios.onGet().reply(404, { data: { message: 'No user/s found' } });
    const response = await ida.getByUsername(idaParameters.mobileNumber);
    expect(response.message).toBe('No user/s found');
    mockAxios.reset();
  });

  test('Should error user does not exists + format', async () => {
    mockAxios.onGet().reply(404, { data: { message: 'No user/s found' } });
    const response = await ida.getByUsername(`+${idaParameters.mobileNumber}`);
    expect(response.message).toBe('No user/s found');
    mockAxios.reset();
  });

  test('Should catch error user does not exists no response', async () => {
    try {
      mockAxios.onGet().reply(404, { data: { noMessage: 'No user/s found' } });
      await ida.getByUsername(`+${idaParameters.mobileNumber}`);
      mockAxios.reset();
    } catch (e) {}
  });

  test('Should create user', async () => {
    mockAxios.onPost().reply(200, { data: { user: true } });
    await ida.createUserV2(idaParameters.mobileNumber);
    mockAxios.reset();
  });

  test('Should catch error on create user', async () => {
    try {
      await ida.createUserV2(idaParameters.mobileNumber);
    } catch (e) {}
  });

  test('Should error with full parameters', async () => {
    try {
      await ida._error({
        message: 'NOT_FOUND',
        statusCode: 404,
        responseCode: 'NOT_FOUND',
      });
    } catch (e) {}
  });

  test('Should error using fallback parameters', async () => {
    try {
      await ida._error({
        message: 'NOT_FOUND',
      });
    } catch (e) {}
  });
});
