const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const AxiosMockAdapter = require('axios-mock-adapter');
const context = require('../../../../utils/lambda-context');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');

const kmsMock = mockClient(KMSClient);
const dynamoMock = mockClient(DynamoDBClient);
let mockAxios;
let handler;

describe('handler-mfa-send-otp', () => {
  beforeEach(() => {
    kmsMock.reset();
    eventData = structuredClone(context(null, null, null, { Authorization: 'token' }).event);
    const axios = require('axios').default;
    mockAxios = new AxiosMockAdapter(axios);
    handler = require('../../../../../src/handlers/mfa/send-otp/v1').handler;
  });

  test('should be able to generate otp', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    dynamoMock.on(PutCommand).resolvesOnce({ Attributes: {} });
    mockAxios.onPost().reply(200);

    const token = await sign({ data: 'data' });

    eventData.headers = { ...eventData.headers, Authorization: token };
    eventData.body = JSON.stringify({ username: 'username', template: 'template', purpose: 'purpose' });

    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 200,
      requestId: expect.any(String),
      code: 'VALID',
      data: expect.any(String),
    });
  });
});
