const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { orchestrationParameters } = require('../../../../fixtures/orchestration-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const axios = require('axios').default;
const AxiosMockAdapter = require('axios-mock-adapter');

const kmsMock = mockClient(KMSClient);
const dynamoMock = mockClient(DynamoDBClient);
let mockAxios = new AxiosMockAdapter(axios);
let generateSmsOtp;

describe('Orchestration Handler', () => {
  beforeAll(async () => {});

  afterAll(async () => {});

  beforeEach(async () => {
    kmsMock.reset();
    dynamoMock.reset();
    mockAxios.reset();
    process.env.NODE_ENV = 'test';
    generateSmsOtp = require('../../../../../src/handlers/orchestration/generate-sms-otp/v2').handler;
  });

  test('POST /orchestration/generate-sms-otp. success', async () => {
    dynamoMock.on(PutCommand).resolves({ Attributes: {} });
    mockAxios.onPost().reply(200, { id: '123456' });
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      mobileNumber: orchestrationParameters.handler.user.username,
    });
    const request = event({
      method: 'POST',
      headers: {
        authorization: `Bearere ${token}`,
      },
      body: {},
    });
    const response = await generateSmsOtp(request);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
  });
});
