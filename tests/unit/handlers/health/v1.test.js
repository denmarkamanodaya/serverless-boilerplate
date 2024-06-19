const AxiosMockAdapter = require('axios-mock-adapter');
const context = require('../../../utils/lambda-context');

let mockAxios;
let handler;

describe('Test Health Handler', () => {
  beforeEach(() => {
    eventData = structuredClone(context(null, null, null, { Authorization: 'token' }).event);
    const axios = require('axios').default;
    mockAxios = new AxiosMockAdapter(axios);
    handler = require('../../../../src/handlers/health/v1').handler;
  });

  test('Should return HTTP 202', async () => {
    const token = 'XXX';

    eventData.headers = { ...eventData.headers, Authorization: token };

    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 202,
      requestId: expect.any(String),
      code: 'VALID',
      data: expect.any(String),
    });
  });
});
