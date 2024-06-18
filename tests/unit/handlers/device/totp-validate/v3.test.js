const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { deviceEnrollmentParameters } = require('../../../../fixtures/device-enrollment-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const AxiosMockAdapter = require('axios-mock-adapter');
const { Devices, Users } = require('../../../../../src/models/index');
const { drop, seed, sync } = require('../../../../utils/base-sync');
const { authenticator } = require('otplib');
const { createSecret } = require('../../../../../src/utils/helpers/totp');
const kmsMock = mockClient(KMSClient);
let totpValidate;

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
    totpValidate = require('../../../../../src/handlers/device/totp-validate/v3').handler;
  });

  test('POST /device/totp-validate when Headers are empty', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {},
      body: { inAppOtp: '123456' },
    });
    const response = await totpValidate(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('"authorization" is required. "x-ud-device-id" is required');
  });

  test('POST /device/totp-validate DEVICE_NOT_OWNED', async () => {
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
    const token2 = await sign({
      authUserId: deviceEnrollmentParameters.handler.user.id,
      deviceId: 'fake-device-id',
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-ud-device-id': token2,
      },
      body: { inAppOtp: '123456' },
    });
    const response = await totpValidate(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.code).toBe('DEVICE_NOT_OWNED');
  });

  test('POST /device/totp-validate DEVICE_NOT_TRUSTED', async () => {
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
        'x-ud-device-id': deviceEnrollmentParameters.handler.device.mobileInstanceId,
      },
      body: { inAppOtp: '123456' },
    });
    await Devices.update({ trusted: false }, { where: { id: deviceEnrollmentParameters.handler.device.id } });
    const response = await totpValidate(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.code).toBe('DEVICE_NOT_TRUSTED');
  });

  test('POST /device/totp-validate ACCESS_CODE empty', async () => {
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
        'x-ud-device-id': deviceEnrollmentParameters.handler.device.mobileInstanceId,
      },
      body: { inAppOtp: '123456' },
    });
    await Devices.update(
      { trusted: true, accessCode: null },
      { where: { id: deviceEnrollmentParameters.handler.device.id } }
    );
    const response = await totpValidate(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.code).toBe('ACCESS_CODE_EMPTY');
  });

  test('POST /device/totp-validate IN_APP_OTP_DISABLED', async () => {
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
        'x-ud-device-id': deviceEnrollmentParameters.handler.device.mobileInstanceId,
      },
      body: { inAppOtp: '123456' },
    });
    await Devices.update(
      { trusted: true, accessCode: '123456', inAppOtpEnabled: 0 },
      { where: { id: deviceEnrollmentParameters.handler.device.id } }
    );
    const response = await totpValidate(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.code).toBe('IN_APP_OTP_DISABLED');
  });

  test('POST /device/totp-validate IN_APP_OTP_INVALID', async () => {
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
        'x-ud-device-id': deviceEnrollmentParameters.handler.device.mobileInstanceId,
      },
      body: { inAppOtp: '123456' },
    });
    await Devices.update(
      { trusted: true, accessCode: '123456', inAppOtpEnabled: 1 },
      { where: { id: deviceEnrollmentParameters.handler.device.id } }
    );
    const response = await totpValidate(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.code).toBe('IN_APP_OTP_INVALID');
  });

  test('Should return valid response when otp is valid', async () => {
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
    const accessCode = createSecret();
    const otp = authenticator.generate(accessCode);
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-ud-device-id': deviceEnrollmentParameters.handler.device.mobileInstanceId,
      },
      body: { inAppOtp: otp },
    });
    await Devices.update(
      { trusted: true, accessCode, inAppOtpEnabled: 1 },
      { where: { id: deviceEnrollmentParameters.handler.device.id } }
    );
    const response = await totpValidate(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
    expect(data.code).toBe('IN_APP_OTP_VERIFIED');
  });
});
