const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { deviceEnrollmentParameters } = require('../../../../fixtures/device-enrollment-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const { Devices, Users, UserSessions } = require('../../../../../src/models/index');
const { drop, seed, sync } = require('../../../../utils/base-sync');
const { authenticator } = require('otplib');
const { createSecret } = require('../../../../../src/utils/helpers/totp');
const axios = require('axios').default;
const AxiosMockAdapter = require('axios-mock-adapter');

const kmsMock = mockClient(KMSClient);
let mockAxios = new AxiosMockAdapter(axios);
let confirmTrustedDeviceHandler;

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
    mockAxios.reset();
    confirmTrustedDeviceHandler = require('../../../../../src/handlers/device/confirm-trusted-device/v3').handler;
  });

  test('POST /device/confirm-trusted when Headers are empty', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {},
    });
    const response = await confirmTrustedDeviceHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('"authorization" is required. "x-device-enrollment-token" is required');
  });

  test('POST /device/confirm-trusted when JWT_INVALID', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: deviceEnrollmentParameters.handler.headers.authorization,
        'x-device-enrollment-token': deviceEnrollmentParameters.handler.headers.authorization,
      },
    });
    const response = await confirmTrustedDeviceHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('JWT_INVALID');
  });

  test('POST /device/confirm-trusted DEVICE_NOT_OWNED', async () => {
    kmsMock.on(SignCommand).resolves({ Signature: 'signature' });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      authUserId: deviceEnrollmentParameters.handler.device.id,
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
    });
    const token2 = await sign({
      authUserId: deviceEnrollmentParameters.handler.device.id,
      deviceId: 'mismatched-device-id',
      mobileNumber: '639994444444',
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-device-enrollment-token': token2,
      },
      body: { inAppOtp: '123456' },
    });

    const response = await confirmTrustedDeviceHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('DEVICE_NOT_OWNED');
  });

  test('POST /device/confirm-trusted empty ACCESS_CODE', async () => {
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
        'x-device-enrollment-token': token,
      },
      body: { inAppOtp: '123456' },
    });

    await Devices.update(
      {
        accessCode: null,
        userId: deviceEnrollmentParameters.handler.user.id,
        mobileInstanceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      },
      { where: { id: deviceEnrollmentParameters.handler.device.id } }
    );
    const response = await confirmTrustedDeviceHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('ACCESS_CODE_EMPTY');
  });

  test('POST /device/confirm-trusted IN_APP_OTP_INVALID', async () => {
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
        'x-device-enrollment-token': token,
      },
      body: { inAppOtp: '123456' },
    });
    await Devices.update(
      { accessCode: 'accessCode' },
      { where: { mobileInstanceId: deviceEnrollmentParameters.handler.device.mobileInstanceId } }
    );
    const response = await confirmTrustedDeviceHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('IN_APP_OTP_INVALID');
  });

  test('POST /device/confirm-trusted enrollment TOKEN_INVALID', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      authUserId: '123456',
      deviceId: '123456',
      mobileNumber: '123456',
      type: 'not-enrollment',
    });
    const token2 = await sign({
      authUserId: deviceEnrollmentParameters.handler.user.id,
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
      type: 'not-enrollment',
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-device-enrollment-token': token2,
      },
      body: { inAppOtp: '123456' },
    });
    const response = await confirmTrustedDeviceHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
  });

  test('POST /device/confirm-trusted enrollment token is invalid', async () => {
    kmsMock.on(SignCommand).resolves({ Signature: 'signature' });
    kmsMock.on(VerifyCommand).resolvesOnce({ SignatureValid: true }).resolvesOnce({ SignatureValid: false });
    const token = await sign({
      authUserId: '123456',
      deviceId: '123456',
      mobileNumber: '123456',
    });
    const token2 = await sign({
      authUserId: deviceEnrollmentParameters.handler.user.id,
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
      type: 'enrollment',
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-device-enrollment-token': token2,
      },
      body: { inAppOtp: '123456' },
    });
    const response = await confirmTrustedDeviceHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
  });

  test('POST /device/confirm-trusted should return valid response when totp is correct', async () => {
    kmsMock.on(SignCommand).resolves({ Signature: 'signature' });
    kmsMock.on(VerifyCommand).resolves({ SignatureValid: true });
    mockAxios
      .onGet()
      .replyOnce(200, { data: { firstName: 'firstName', customerDetails: { emailAddress: 'emailAddress' } } });
    mockAxios.onPost().reply(200);
    const token = await sign({
      authUserId: '123456',
      deviceId: '123456',
      mobileNumber: '123456',
    });
    const token2 = await sign({
      authUserId: deviceEnrollmentParameters.handler.user.id,
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
      type: 'enrollment',
    });
    const accessCode = createSecret();
    await Devices.update({ accessCode }, { where: { id: deviceEnrollmentParameters.handler.device.id } });
    const otp = authenticator.generate(accessCode);
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-device-enrollment-token': token2,
      },
      body: { inAppOtp: otp },
    });
    const response = await confirmTrustedDeviceHandler(requestBody);
    const data = JSON.parse(response.body);

    expect(data.status).toBe(httpStatus.OK);
  });

  test('POST /device/confirm-trusted should pass through and return valid response if onboarding data is missing', async () => {
    mockAxios.onGet().replyOnce(500);
    kmsMock.on(SignCommand).resolves({ Signature: 'signature' });
    kmsMock.on(VerifyCommand).resolves({ SignatureValid: true });
    const token = await sign({
      authUserId: '123456',
      deviceId: '123456',
      mobileNumber: '123456',
    });
    const token2 = await sign({
      authUserId: deviceEnrollmentParameters.handler.user.id,
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
      type: 'enrollment',
    });
    const accessCode = createSecret();
    await Devices.update({ trusted: false, accessCode }, { where: { id: deviceEnrollmentParameters.handler.device.id } });
    const otp = authenticator.generate(accessCode);
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-device-enrollment-token': token2,
      },
      body: { inAppOtp: otp },
    });
    const response = await confirmTrustedDeviceHandler(requestBody);
    const data = JSON.parse(response.body);

    expect(data.status).toBe(httpStatus.OK);
  });

  test('POST /device/confirm-trusted should pass through and return valid response if notification call failed', async () => {
    mockAxios
      .onGet()
      .replyOnce(200, { data: { firstName: 'firstName', customerDetails: { emailAddress: 'emailAddress' } } });
    mockAxios.onPost().reply(500);
    kmsMock.on(SignCommand).resolves({ Signature: 'signature' });
    kmsMock.on(VerifyCommand).resolves({ SignatureValid: true });
    const token = await sign({
      authUserId: '123456',
      deviceId: '123456',
      mobileNumber: '123456',
    });
    const token2 = await sign({
      authUserId: deviceEnrollmentParameters.handler.user.id,
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
      type: 'enrollment',
    });
    const accessCode = createSecret();
    await Devices.update({ trusted: false, accessCode }, { where: { id: deviceEnrollmentParameters.handler.device.id } });
    const otp = authenticator.generate(accessCode);
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-device-enrollment-token': token2,
      },
      body: { inAppOtp: otp },
    });
    const response = await confirmTrustedDeviceHandler(requestBody);
    const data = JSON.parse(response.body);

    expect(data.status).toBe(httpStatus.OK);
  });

  test('POST /device/confirm-trusted should not send notification if device is already trusted', async () => {
    kmsMock.on(SignCommand).resolves({ Signature: 'signature' });
    kmsMock.on(VerifyCommand).resolves({ SignatureValid: true });
    const token = await sign({
      authUserId: '123456',
      deviceId: '123456',
      mobileNumber: '123456',
    });
    const token2 = await sign({
      authUserId: deviceEnrollmentParameters.handler.user.id,
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
      type: 'enrollment',
    });
    const accessCode = createSecret();
    await Devices.update({ trusted: true, accessCode }, { where: { id: deviceEnrollmentParameters.handler.device.id } });
    const otp = authenticator.generate(accessCode);
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-device-enrollment-token': token2,
      },
      body: { inAppOtp: otp },
    });
    const response = await confirmTrustedDeviceHandler(requestBody);
    const data = JSON.parse(response.body);

    expect(data.status).toBe(httpStatus.OK);
  });
});
