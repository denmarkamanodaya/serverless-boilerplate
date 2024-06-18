const {
  wso2MigrationCounter,
  incrementFailedLoginCounter,
  resetFailedLoginCounter,
} = require('../../../utils/helpers/counter-helper');
const { checkUserExist, migrateUser, getUser, getCustomerDetails } = require('../../../utils/helpers/user-helper');
const { jwtLoginMapper, jwtLoginNewlyOnboardedMapper } = require('../../../utils/mappers/jwt-mapper');
const { httpResponseCodes, authServiceResponseCodes } = require('../../../utils/response-codes');
const { createUserSession, disableConcurrentLogin } = require('../../../utils/helpers/session-helper');
const { validatePasswords, throwCustomError } = require('../../../utils/helpers/login-helper');
const { newDeviceFullMapper } = require('../../../utils/mappers/notification-mapper');
const { createOneKosmosUser } = require('../../../utils/helpers/onekosmos-helper');
const { sendSMS, sendEmail } = require('../../notification-service/v2/notification-service');
const { wso2Login } = require('../../../utils/helpers/wso2-helper');
const { sign } = require('../../../utils/helpers/jwt-helperv2');
const { IamError } = require('../../../utils/custom-errors/class-errors');
const { send } = require('../../../services/fraud-monitoring-service/fraud-monitoring-service');
const httpStatus = require('http-status');
const logger = require('../../../utils/helpers/logger');
const DeviceHelper = require('../../../utils/helpers/device-helper');
const MigrationHelper = require('../../../utils/helpers/migration-helper');

// For deprecation on the next login version
const { UdIdaService } = require('../../ida-service/ida-service');
const ida = new UdIdaService();

module.exports.login = async (data) => {
  const { body, headers } = data;
  const { username, password, sessionId, deviceId } = body;
  const ip = headers['x-original-forwarded-for'] || '';

  logger.info(`[login] | ${JSON.stringify({ username, headers })}`);

  try {
    const isUserExist = await checkUserExist({ username });
    if (!isUserExist) {
      const wso2Data = await wso2Login({ username, password });
      if (!wso2Data) {
        return throwCustomError({
          message: httpResponseCodes.USER_DOES_NOT_EXIST.value,
          code: httpResponseCodes.USER_DOES_NOT_EXIST.value,
          status: httpStatus.NOT_FOUND,
        });
      }
      await migrateUser(body);
      await wso2MigrationCounter();
    }

    await disableConcurrentLogin({ username });
    const authUser = await getUser({ username });

    if (!authUser.isActive)
      return throwCustomError({
        message: httpResponseCodes.USER_LOCKED.value,
        code: httpResponseCodes.USER_LOCKED.value,
        status: httpStatus.LOCKED,
      });

    if (authUser.password) {
      const validationRes = await validatePasswords({ authUser, password });
      if (!validationRes) {
        await incrementFailedLoginCounter({ username });
        return throwCustomError({
          message: authServiceResponseCodes.PASSWORD_DO_NOT_MATCH.value,
          code: authServiceResponseCodes.PASSWORD_DO_NOT_MATCH.value,
          status: httpStatus.UNAUTHORIZED,
        });
      }
      await resetFailedLoginCounter({ username });
    }

    const customerData = await getCustomerDetails({ username });
    const migrationHelper = new MigrationHelper({ authUser, customerData, data });
    migrationHelper.syncMembershipId();

    if (!authUser.password) await migrationHelper.generatePassword();

    // get session
    const deviceInfo = await ida.getDeviceInfo(sessionId);
    const isSessionExist = deviceInfo.isSessionExist;
    const deviceMakeModel = deviceInfo.deviceMakeModel || 'a device';
    const deviceHelper = new DeviceHelper({
      authUser,
      device: {
        deviceId,
        deviceMakeModel,
      },
    });
    const isDeviceAvailable = await deviceHelper.isDevicExistAndNotOwned();

    if (!isDeviceAvailable) {
      return throwCustomError({
        message: httpResponseCodes.DEVICE_NOT_OWNED.value,
        code: httpResponseCodes.DEVICE_NOT_OWNED.value,
        status: httpStatus.UNAUTHORIZED,
      });
    } else {
      const notificationPayload = newDeviceFullMapper({ customerData, ...{ deviceMakeModel }, ...data });
      const isDeviceNewRecord = await deviceHelper.associateDevice();
      console.log(notificationPayload);
      if (isDeviceNewRecord && isSessionExist) {
        Promise.all([sendSMS(notificationPayload), sendEmail(notificationPayload)]);
      }
    }

    createOneKosmosUser({ username });

    send({
      ...headers,
      ...body,
      ip,
      id: customerData?.id,
    });

    const payload = customerData
      ? jwtLoginMapper({ authUser, customerData, ...data })
      : jwtLoginNewlyOnboardedMapper({ authUser, ...data });
    const jwt = await sign(payload);

    await createUserSession({
      userId: authUser.id,
      deviceId: deviceId,
      accessToken: jwt,
    });

    return {
      isSessionExist,
      baasToken: { accessToken: jwt },
    };
  } catch (e) {
    logger.info(`[login-catch] | ${JSON.stringify({ e })}`);
    if (['PASSWORD_DO_NOT_MATCH', 'Mobile number does not exists.'].includes(e.message) && customerData?.cid !== null) {
      send(
        {
          ...headers,
          ...body,
          ip,
          id: customerData?.id,
        },
        e
      );
    }
    throw new IamError(e.message, e.code, e.statusCode);
  }
};
