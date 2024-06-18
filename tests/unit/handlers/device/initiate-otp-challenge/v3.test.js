const httpStatus = require('http-status');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { mockClient } = require('aws-sdk-client-mock');
const event = require('../../../../utils/eventGenerator');
const { deviceEnrollmentParameters } = require('../../../../fixtures/device-enrollment-fixtures');
const { sign } = require('../../../../../src/utils/helpers/jwt-helperv2');
const { Devices, Users } = require('../../../../../src/models/index');
const { drop, seed, sync } = require('../../../../utils/base-sync');

let initiateOtpChallengeHandler;

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
    process.env.NODE_ENV = 'test';
    initiateOtpChallengeHandler = require('../../../../../src/handlers/device/initiate-enrollment/v3').handler;
  });

  describe('Failed initiate-otp-challenge handler scenarios', () => {
    test('POST /device/initiate-otp-challenge when Headers are empty', async () => {
      const requestBody = event({
        method: 'POST',
        headers: {},
      });
      const response = await initiateOtpChallengeHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.BAD_REQUEST);
      expect(data.data.message).toBe('"authorization" is required');
    });
    test('POST /device/initiate-otp-challenge when JWT_INVALID', async () => {
      const requestBody = event({
        method: 'POST',
        headers: {
          authorization: deviceEnrollmentParameters.handler.headers.authorization,
          'x-device-enrollment-token': deviceEnrollmentParameters.handler.headers.authorization,
        },
      });
      const response = await initiateOtpChallengeHandler(requestBody);
      const data = JSON.parse(response.body);
      expect(data.status).toBe(httpStatus.UNAUTHORIZED);
      expect(data.data.message).toBe('JWT_INVALID');
    });
  });
});
