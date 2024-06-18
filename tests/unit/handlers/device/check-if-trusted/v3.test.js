const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { deviceEnrollmentParameters } = require('../../../../fixtures/device-enrollment-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const { Devices, Users } = require('../../../../../src/models/index');
const { drop, seed, sync } = require('../../../../utils/base-sync');

const kmsMock = mockClient(KMSClient);
let checkIfTrustedHandler;

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
    checkIfTrustedHandler = require('../../../../../src/handlers/device/check-if-trusted/v3').handler;
  });

  test('POST /device/check-if-trusted when Headers are empty', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {},
    });
    const response = await checkIfTrustedHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('"authorization" is required');
  });
  test('POST /device/check-if-trusted when JWT_INVALID', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: deviceEnrollmentParameters.handler.headers.authorization,
        'x-device-confirmation-token': deviceEnrollmentParameters.handler.headers.authorization,
      },
    });
    const response = await checkIfTrustedHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('JWT_INVALID');
  });

  test('POST /device/check-if-trusted DEVICE_NOT_FOUND', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      authUserId: deviceEnrollmentParameters.handler.device.id,
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      mobileNumber: '639994443333',
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {},
    });
    const response = await checkIfTrustedHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.NOT_FOUND);
    expect(data.data.message).toBe('DEVICE_NOT_FOUND');
  });

  test('should return valid response when access is null', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      authUserId: deviceEnrollmentParameters.handler.user.id,
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      mobileNumber: '639994443333',
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {},
    });
    await Devices.update(
      { trusted: true, accessCode: null },
      {
        where: {
          id: deviceEnrollmentParameters.handler.device.id,
        },
      }
    );
    const response = await checkIfTrustedHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
    expect(data.code).toBe('DEVICE_TRUSTED');
  });

  test('should return valid response when access code is already existing', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      authUserId: deviceEnrollmentParameters.handler.user.id,
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      mobileNumber: '639994443333',
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {},
    });
    await Devices.update(
      { trusted: true, accessCode: 'accessCode' },
      {
        where: {
          id: deviceEnrollmentParameters.handler.device.id,
        },
      }
    );
    const response = await checkIfTrustedHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
    expect(data.code).toBe('DEVICE_TRUSTED');
  });

  test('should return error device is not trusted', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      authUserId: deviceEnrollmentParameters.handler.user.id,
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      mobileNumber: '639994443333',
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {},
    });
    await Devices.update(
      { trusted: false },
      {
        where: {
          id: deviceEnrollmentParameters.handler.device.id,
        },
      }
    );
    const response = await checkIfTrustedHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
    expect(data.code).toBe('DEVICE_NOT_TRUSTED');
  });
});
