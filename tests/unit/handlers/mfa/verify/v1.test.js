const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const moment = require('moment');
const context = require('../../../../utils/lambda-context');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const { handler } = require('../../../../../src/handlers/mfa/verify/v1');

const kmsMock = mockClient(KMSClient);
const dynamoMock = mockClient(DynamoDBClient);
let ddbCounterData;
let ddbOtpData;

describe('handler-mfa-verify', () => {
  beforeEach(() => {
    ddbCounterData = structuredClone({
      dataset: 'dataset',
      sort_key: 'sortkey',
      invalid_otp_count: '0',
      is_locked: false,
      locked_until: null,
      created_at: null,
      updated_at: null,
    });
    ddbOtpData = structuredClone({
      dataset: 'dataset',
      sort_key: 'sortkey',
      purpose: 'purpose',
      otp: 'otp',
      is_used: false,
      duration: null,
      country_code: null,
      transaction_id: null,
      mfa_token: null,
      validity_until: null,
      created_at: null,
      updated_at: null,
    });
    kmsMock.reset();
    dynamoMock.reset();
    eventData = structuredClone(context(null, null, null, { Authorization: 'token' }).event);
  });

  test('should return a soft lock error when the otp counter is_locked field is true', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });

    ddbCounterData.is_locked = true;
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbCounterData });

    const token = await sign({ mobileNumber: 'mobileNumber' });

    eventData.headers = { ...eventData.headers, Authorization: token };
    eventData.body = JSON.stringify({ token, otp: '123456' });

    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'SOFT_LOCK',
      data: {
        message: 'SOFT_LOCK',
      },
    });
  });

  test('should return otp invalid error when otp item is not found in ddb', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });

    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbCounterData }).resolvesOnce({ Item: null });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });
    const token = await sign({ mobileNumber: 'mobileNumber' });

    eventData.headers = { ...eventData.headers, Authorization: token };
    eventData.body = JSON.stringify({ token, otp: '123456' });

    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 400,
      requestId: expect.any(String),
      code: 'OTP_INVALID',
      data: {
        message: 'OTP_INVALID',
      },
    });
  });

  test('should return a otp expired error when the otp item validity until is less then the current timestamp', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });

    ddbOtpData.validity_until = moment().subtract(3600, 'seconds').format();
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbCounterData }).resolvesOnce({ Item: ddbOtpData });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });

    const token = await sign({ mobileNumber: 'mobileNumber' });

    eventData.headers = { ...eventData.headers, Authorization: token };
    eventData.body = JSON.stringify({ token, otp: '123456' });

    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'OTP_EXPIRED',
      data: {
        message: 'OTP_EXPIRED',
      },
    });
  });

  test('should return a otp is used error when the otp item is_used field is true', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });

    ddbOtpData.validity_until = moment().add(3600, 'seconds').format();
    ddbOtpData.is_used = true;
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbCounterData }).resolvesOnce({ Item: ddbOtpData });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });

    const token = await sign({ mobileNumber: 'mobileNumber' });

    eventData.headers = { ...eventData.headers, Authorization: token };
    eventData.body = JSON.stringify({ token, otp: '123456' });

    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'OTP_USED',
      data: {
        message: 'OTP_USED',
      },
    });
  });

  test('should return valid response when otp is valid', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });

    ddbOtpData.validity_until = moment().add(3600, 'seconds').format();
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbCounterData }).resolvesOnce({ Item: ddbOtpData });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });

    const token = await sign({ mobileNumber: 'mobileNumber' });

    eventData.headers = { ...eventData.headers, Authorization: token };
    eventData.body = JSON.stringify({ token, otp: '123456' });

    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 200,
      requestId: expect.any(String),
      code: 'VALID',
      data: 'VERIFIED',
    });
  });

  test('should return soft lock error when counter reached the limit', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });

    ddbCounterData.invalid_otp_count = 2;
    ddbOtpData.validity_until = moment().subtract(3600, 'seconds').format();
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbCounterData }).resolvesOnce({ Item: ddbOtpData });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });

    const token = await sign({ mobileNumber: 'mobileNumber' });

    eventData.headers = { ...eventData.headers, Authorization: token };
    eventData.body = JSON.stringify({ token, otp: '123456' });

    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'SOFT_LOCK',
      data: {
        message: 'SOFT_LOCK',
      },
    });
  });

  test('should reset otp counter when lock down cooldown is less then the current timestamp', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });

    ddbCounterData.locked_until = moment().subtract(3600, 'seconds').format();
    dynamoMock.on(GetCommand).resolvesOnce({ Item: ddbCounterData }).resolvesOnce({ Item: ddbOtpData });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });

    const token = await sign({ mobileNumber: 'mobileNumber' });

    eventData.headers = { ...eventData.headers, Authorization: token };
    eventData.body = JSON.stringify({ token, otp: '123456' });

    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 200,
      requestId: expect.any(String),
      code: 'VALID',
      data: 'VERIFIED',
    });
  });

  test('should create an entry for otp counter when otp is not valid', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });

    ddbOtpData.is_used = true;
    dynamoMock.on(GetCommand).resolvesOnce({ Item: null }).resolvesOnce({ Item: ddbOtpData });
    dynamoMock.on(UpdateCommand).resolves({ Attributes: {} });

    const token = await sign({ mobileNumber: 'mobileNumber' });

    eventData.headers = { ...eventData.headers, Authorization: token };
    eventData.body = JSON.stringify({ token, otp: '123456' });

    const response = await handler(eventData);
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({
      status: 401,
      requestId: expect.any(String),
      code: 'OTP_USED',
      data: {
        message: 'OTP_USED',
      },
    });
  });
});
