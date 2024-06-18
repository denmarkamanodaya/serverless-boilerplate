const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { deviceEnrollmentParameters } = require('../../../../fixtures/device-enrollment-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const { Devices, Users } = require('../../../../../src/models/index');
const { drop, seed, sync } = require('../../../../utils/base-sync');
const axios = require('axios').default;
const AxiosMockAdapter = require('axios-mock-adapter');

const kmsMock = mockClient(KMSClient);
let mockAxios = new AxiosMockAdapter(axios);
let untrustHandler;

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
    untrustHandler = require('../../../../../src/handlers/device/untrust/v3').handler;
  });

  test('POST /device/untrust when Headers are empty', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {},
    });
    const response = await untrustHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.BAD_REQUEST);
    expect(data.data.message).toBe('"pathParameters" must be of type object. "authorization" is required');
  });

  test('POST /device/untrust when JWT_INVALID', async () => {
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: deviceEnrollmentParameters.handler.headers.authorization,
      },
      pathParametersObject: {
        deviceId: '123456',
      },
    });
    const response = await untrustHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('JWT_INVALID');
  });

  test('POST /device/untrust when deviceId mismatch / JWT_INVALID', async () => {
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
      },
      pathParametersObject: {
        deviceId: '123456',
      },
    });
    const response = await untrustHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.UNAUTHORIZED);
    expect(data.data.message).toBe('JWT_INVALID');
  });

  test('POST /device/untrust DEVICE_NOT_FOUND', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      authUserId: '12345',
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      pathParametersObject: {
        deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      },
    });
    const response = await untrustHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.NOT_FOUND);
    expect(data.data.message).toBe('DEVICE_NOT_FOUND');
  });

  test('POST /device/untrust DEVICE_NOT_TRUSTED', async () => {
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      authUserId: deviceEnrollmentParameters.handler.user.id,
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      pathParametersObject: {
        deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      },
    });
    await Devices.update({ trusted: false }, { where: { id: deviceEnrollmentParameters.handler.device.id } });
    const response = await untrustHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.FORBIDDEN);
    expect(data.data.message).toBe('DEVICE_NOT_TRUSTED');
  });

  test('should be able to untrust device', async () => {
    mockAxios
      .onGet()
      .replyOnce(200, { data: { customerDetails: { firstName: 'firstName', emailAddress: 'emailAddress' } } });
    mockAxios.onPost().reply(200);
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      authUserId: deviceEnrollmentParameters.handler.user.id,
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      pathParametersObject: {
        deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      },
    });
    await Devices.update({ trusted: true }, { where: { id: deviceEnrollmentParameters.handler.device.id } });
    const response = await untrustHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
    expect(data.data).toBe('DEVICE_HAS_BEEN_UNTRUSTED');
  });

  test('should pass through when onboarding data incomplete or undefined', async () => {
    mockAxios.onGet().replyOnce(400);
    mockAxios.onPost().reply(200);
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      authUserId: deviceEnrollmentParameters.handler.user.id,
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      pathParametersObject: {
        deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      },
    });
    await Devices.update({ trusted: true }, { where: { id: deviceEnrollmentParameters.handler.device.id } });
    const response = await untrustHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
    expect(data.data).toBe('DEVICE_HAS_BEEN_UNTRUSTED');
  });

  test('should pass through when notification call failed', async () => {
    mockAxios
      .onGet()
      .replyOnce(200, { data: { customerDetails: { firstName: 'firstName', emailAddress: 'emailAddress' } } });
    mockAxios.onPost().reply(500);
    kmsMock.on(SignCommand).resolves({
      Signature: 'signature',
    });
    kmsMock.on(VerifyCommand).resolves({
      SignatureValid: true,
    });
    const token = await sign({
      deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      authUserId: deviceEnrollmentParameters.handler.user.id,
      mobileNumber: deviceEnrollmentParameters.handler.user.username,
    });
    const requestBody = event({
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      pathParametersObject: {
        deviceId: deviceEnrollmentParameters.handler.device.mobileInstanceId,
      },
    });
    await Devices.update({ trusted: true }, { where: { id: deviceEnrollmentParameters.handler.device.id } });
    const response = await untrustHandler(requestBody);
    const data = JSON.parse(response.body);
    expect(data.status).toBe(httpStatus.OK);
    expect(data.data).toBe('DEVICE_HAS_BEEN_UNTRUSTED');
  });
});
