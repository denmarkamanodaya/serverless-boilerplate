// eslint-disable-next-line node/no-unpublished-require
const AxiosMockAdapter = require('axios-mock-adapter');
const axios = require('axios').default;

const mockAxios = new AxiosMockAdapter(axios);
let axiosInstance;

describe('helper-axios', () => {
  beforeEach(() => {
    mockAxios.reset();
    const { AxiosInterceptor } = require('../../../../src/common/axios-interceptor');
    axiosInstance = new AxiosInterceptor({}).axiosInstance;
  });

  test('Should return a success axios request', async () => {
    mockAxios.onGet().replyOnce(200);
    const { status } = await axiosInstance.get('/');
    expect(status).toBe(200);
  });

  test('Response error', async () => {
    mockAxios.onGet().replyOnce(400, { data: 'data' });
    await expect(axiosInstance.get('/')).rejects.toThrow('Request failed with status code 400');
  });

  test('Response network error', async () => {
    mockAxios.onGet().networkErrorOnce();
    await expect(axiosInstance.get('/')).rejects.toThrow('Network Error');
  });
});
