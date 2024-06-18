const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { deviceEnrollmentParameters } = require('../../../../fixtures/device-enrollment-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const { Devices, Users } = require('../../../../../src/models/index');
const { drop, seed, sync } = require('../../../../utils/base-sync');

const kmsMock = mockClient(KMSClient);
let confirmEnrollmentHandler;

describe('Device Enrollment Handler', () => {
  beforeAll(async () => {
    await sync();
    await seed('Users', deviceEnrollmentParameters.handler.user);
    await seed('Devices', deviceEnrollmentParameters.handler.device);
  });

  afterAll(async () => {
    await drop();
  });

  beforeEach(async () => {
    kmsMock.reset();
    process.env.NODE_ENV = 'test';
    confirmEnrollmentHandler = require('../../../../../src/handlers/device/confirm-enrollment/v3').handler;
  });

  describe('Failed and Success confirm-enrollment handler scenarios', () => {
    test('POST /device/confirm-enrollment when Headers are empty', async () => {
      const requestBody = event({
        method: 'POST',
        headers: {},
      });
      const response = await confirmEnrollmentHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.BAD_REQUEST);
      expect(data.data.message).toBe('"authorization" is required. "x-device-confirmation-token" is required');
    });
    test('POST /device/confirm-enrollment when JWT_INVALID', async () => {
      const requestBody = event({
        method: 'POST',
        headers: {
          authorization: deviceEnrollmentParameters.handler.headers.authorization,
          'x-device-confirmation-token': deviceEnrollmentParameters.handler.headers.authorization,
        },
      });
      const response = await confirmEnrollmentHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.UNAUTHORIZED);
      expect(data.data.message).toBe('JWT_INVALID');
    });
    test('POST /device/confirm-enrollment mismatched', async () => {
      kmsMock.on(SignCommand).resolves({
        Signature: 'signature',
      });
      kmsMock.on(VerifyCommand).resolves({
        SignatureValid: true,
      });
      const token = await sign(deviceEnrollmentParameters.handler.decodedToken);
      const token2 = await sign({ mobileNumber: '123456', deviceId: '123456', authUserId: '123456' });
      const requestBody = event({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'x-device-confirmation-token': token2,
        },
      });
      const response = await confirmEnrollmentHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.UNAUTHORIZED);
      expect(data.data.message).toBe('TOKEN_MISMATCH');
    });
    test('POST /device/confirm-enrollment 200', async () => {
      kmsMock.on(SignCommand).resolves({
        Signature: 'signature',
      });
      kmsMock.on(VerifyCommand).resolves({
        SignatureValid: true,
      });
      const token = await sign(deviceEnrollmentParameters.handler.decodedToken);
      const requestBody = event({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'x-device-confirmation-token': token,
        },
      });
      const response = await confirmEnrollmentHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.OK);
      expect(data.code).toBe('VALID');
    });
    test('should return an error when confirmation token is invalid', async () => {
      kmsMock.on(SignCommand).resolves({
        Signature: 'signature',
      });
      kmsMock.on(VerifyCommand).resolvesOnce({ SignatureValid: true }).resolvesOnce({ SignatureValid: false });
      const token = await sign(deviceEnrollmentParameters.handler.decodedToken);
      const requestBody = event({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'x-device-confirmation-token': token,
        },
      });
      const response = await confirmEnrollmentHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.UNAUTHORIZED);
      expect(data.code).toBe('JWT_INVALID');
    });
  });
});
