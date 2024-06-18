const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { deviceEnrollmentParameters } = require('../../../../fixtures/device-enrollment-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const { Devices, Users } = require('../../../../../src/models/index');
const { drop, seed, sync } = require('../../../../utils/base-sync');

const kmsMock = mockClient(KMSClient);
let initiateEnrollmentHandler;

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
    initiateEnrollmentHandler = require('../../../../../src/handlers/device/initiate-enrollment/v3').handler;
  });

  describe('Failed & Sucess initiate-enrollment handler scenarios', () => {
    test('POST /device/initiate-enrollment  when Headers are empty', async () => {
      const requestBody = event({
        method: 'POST',
        headers: {},
      });
      const response = await initiateEnrollmentHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.BAD_REQUEST);
      expect(data.data.message).toBe('"authorization" is required');
    });

    test('POST /device/initiate-enrollment  when JWT_INVALID', async () => {
      const requestBody = event({
        method: 'POST',
        headers: {
          authorization: deviceEnrollmentParameters.handler.headers.authorization,
          'x-device-enrollment-token': deviceEnrollmentParameters.handler.headers.authorization,
        },
      });
      const response = await initiateEnrollmentHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.UNAUTHORIZED);
      expect(data.data.message).toBe('JWT_INVALID');
    });

    test('POST /device/initiate-enrollment DEVICE_NOT_FOUND', async () => {
      kmsMock.on(SignCommand).resolves({
        Signature: 'signature',
      });
      kmsMock.on(VerifyCommand).resolves({
        SignatureValid: true,
      });
      const token = await sign({
        authUserId: deviceEnrollmentParameters.handler.user.id,
        deviceId: 'fake-device-id',
        mobileNumber: deviceEnrollmentParameters.handler.user.username,
      });
      const requestBody = event({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      await Devices.update(
        { accessCode: 'accessCode' },
        { where: { mobileInstanceId: deviceEnrollmentParameters.handler.device.mobileInstanceId } }
      );
      const response = await initiateEnrollmentHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.NOT_FOUND);
      expect(data.data.message).toBe('DEVICE_NOT_FOUND');
    });

    test('POST /device/initiate-enrollment DEVICE_ALREADY_TRUSTED', async () => {
      kmsMock.on(SignCommand).resolves({
        Signature: 'signature',
      });
      kmsMock.on(VerifyCommand).resolves({
        SignatureValid: true,
      });
      const token = await sign({
        authUserId: deviceEnrollmentParameters.handler.user.id,
        deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
        mobileNumber: deviceEnrollmentParameters.handler.user.username,
      });
      const requestBody = event({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      await Devices.update(
        { trusted: true },
        { where: { mobileInstanceId: deviceEnrollmentParameters.handler.device.mobileInstanceId } }
      );
      const response = await initiateEnrollmentHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.NOT_FOUND);
      expect(data.data.message).toBe('DEVICE_ALREADY_TRUSTED');
    });

    test('POST /device/initiate-enrollment DEVICE_NOT_OWNED', async () => {
      kmsMock.on(SignCommand).resolves({
        Signature: 'signature',
      });
      kmsMock.on(VerifyCommand).resolves({
        SignatureValid: true,
      });
      const token = await sign({
        authUserId: '12345678',
        deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
        mobileNumber: deviceEnrollmentParameters.handler.user.username,
      });
      const requestBody = event({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      await Devices.update(
        { trusted: true },
        { where: { mobileInstanceId: deviceEnrollmentParameters.handler.device.mobileInstanceId } }
      );
      const response = await initiateEnrollmentHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.FORBIDDEN);
      expect(data.data.message).toBe('DEVICE_NOT_OWNED');
    });

    test('POST /device/initiate-enrollment 200', async () => {
      kmsMock.on(SignCommand).resolves({
        Signature: 'signature',
      });
      kmsMock.on(VerifyCommand).resolves({
        SignatureValid: true,
      });
      const token = await sign({
        authUserId: deviceEnrollmentParameters.handler.user.id,
        deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
        mobileNumber: deviceEnrollmentParameters.handler.user.username,
      });
      const requestBody = event({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      await Devices.update(
        { trusted: false },
        { where: { mobileInstanceId: deviceEnrollmentParameters.handler.device.mobileInstanceId } }
      );
      const response = await initiateEnrollmentHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.OK);
      expect(data.code).toBe('VALID');
    });

    test('should return enrollment token when already trusted to another device', async () => {
      kmsMock.on(SignCommand).resolves({
        Signature: 'signature',
      });
      kmsMock.on(VerifyCommand).resolves({
        SignatureValid: true,
      });
      const token = await sign({
        authUserId: deviceEnrollmentParameters.handler.user.id,
        deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
        mobileNumber: deviceEnrollmentParameters.handler.user.username,
      });
      const requestBody = event({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      await Devices.create({
        trusted: true,
        userId: deviceEnrollmentParameters.handler.user.id,
        mobileInstanceId: 'random',
      });
      const response = await initiateEnrollmentHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.OK);
      expect(data.code).toBe('VALID');
    });
  });
});
