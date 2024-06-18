const httpStatus = require('http-status');
const logger = require('../../utils/helpers/logger');
const { incrementFailedLoginCounter, resetFailedLoginCounter } = require('../../utils/helpers/counter-helper');
const { createUserSession, disableConcurrentLogin } = require('../../utils/helpers/session-helper');
const { defaultMiddleware: middleware } = require('../../middlewares/middy');
const { getUser } = require('../../utils/helpers/user-helper');
const { getCustomerByMobile } = require('../../utils/helpers/onboarding-service');
const { isDevicExistAndNotOwned, associateDevice } = require('../../utils/helpers/device-helper');
const { validatePassword, throwGenericError } = require('../../utils/helpers/login-helper');
const { createOneKosmosUser } = require('../../utils/helpers/onekosmos-helper');
const { newDeviceFullMapper } = require('../../utils/mappers/notification-mapper');
const { sendSMS, sendEmail } = require('../../services/notification-service/v2/notification-service');
const { validateLoginV6 } = require('../../utils/validators/login');
const { fraudCheck } = require('../../utils/helpers/fraud-monitoring-service');
const { Users } = require('../../models/index');
const { sign } = require('../../utils/helpers/jwt-helperv2');
const { httpResponseCodes } = require('../../utils/response-codes');

/*
- check if the user exists
- if the user exists, evaluate password
- if the password is incorrect, throw an error, maybe increase the invalid login count
- if the password is correct, generate token
*/

module.exports.handler = middleware(async ({ body, headers }) => {
  const deviceId = headers['x-ud-device-id'];
  const { username, password } = body;

  logger.info(`[login] | ${JSON.stringify({ username, headers })}`);

  let authUser = await getUser({ username }); // user data from the auth service

  if (!authUser) {
    // Send to TMX
    await notifyTmx(headers, 'unknown_user', username).catch((e) => {
      logger.debug(`[login-catch-tmx] | ${JSON.stringify(e)}`);
    });

    throwGenericError(httpStatus.NOT_FOUND);
  }

  // check if the user is deactivated
  if (!authUser.isActive) throwGenericError(httpStatus.LOCKED);

  // handle NULL salt and password
  if (!authUser.password || !authUser.salt) throwGenericError(httpStatus.NOT_FOUND);

  const customerDataFetch = await getCustomerByMobile(username).catch((e) => {
    logger.info(`[login-catch-onboarding-svc] | ${JSON.stringify(e)}`);
  }); // customer data from the onboarding services
  const customerData = customerDataFetch?.data?.data;

  const authUserId = authUser.id;

  const isPwValid = validatePassword({
    salt: authUser.salt,
    inputPassword: password,
    existingPasswordHash: authUser.password,
  });

  // is the password does not match
  if (!isPwValid) {
    // increment failed login counter
    // report to tmx a failed login attempt
    await Promise.all([
      incrementFailedLoginCounter({ username }),
      notifyTmx(headers, 'login_failed', customerData).catch((e) => {
        logger.debug(`[login-catch-tmx] | ${JSON.stringify(e)}`);
      }),
    ]);

    throwGenericError(httpStatus.UNAUTHORIZED);
  }

  // if the password matches
  // reset failed login counter
  await resetFailedLoginCounter({ username });

  // Sync membershipId
  if (customerData && customerData.id !== authUser.membershipId) {
    await Users.update(
      {
        membershipId: `${customerData.id}`,
      },
      {
        where: { id: authUserId },
      }
    );
  }

  // Check device association, return DEVICE_NOT_OWNED
  // if the device is already associated to another user
  const isDeviceAvailable = await isDevicExistAndNotOwned({ authUserId: authUser.id, deviceId });
  if (!isDeviceAvailable) {
    throwGenericError(httpStatus.UNAUTHORIZED);
  }

  // Create JWToken
  const jwtPayload = (() => {
    const customerInfo = {
      username,
      mobileNumber: username,
      deviceId,
      authUserId,
    };

    if (!customerData?.cid) return customerInfo;

    return {
      ...customerInfo,
      emailAddress: customerData.customerDetails.emailAddress,
      customerId: customerData.id,
      consumerId: customerData.id,
      cid: customerData.cid,
      id: authUserId,
    };
  })();

  const tmxResponseFetch = await notifyTmx(headers, 'login_success', customerData).catch((e) => {
    // can change to throw if you want this to be blocking the flow
    logger.debug(`[login-catch-tmx] | ${JSON.stringify(e)}`);
  });

  logger.debug(
    `[tmx-response] | ${typeof tmxResponseFetch?.data === 'object' ? JSON.stringify(tmxResponseFetch.data) : 'No data'}`
  );

  if (tmxResponseFetch && tmxResponseFetch?.data?.data?.disposition !== 'Allow') {
    throwGenericError(httpStatus.UNAUTHORIZED);
  }

  await disableConcurrentLogin({ username });

  const jwt = await sign(jwtPayload);

  await Promise.all([
    createUserSession({
      userId: authUserId,
      deviceId,
      accessToken: jwt,
    }),
    sendNewDeviceNotification({
      authUserId,
      deviceId,
      headers,
      username,
      customerData,
    }),
    createOneKosmosUser({ username }),
  ]);

  return { data: { baasToken: { accessToken: jwt } }, code: httpResponseCodes.ACCESS_CODE_GENERATED };
}, validateLoginV6);

async function sendNewDeviceNotification({ authUserId, deviceId, headers, username, customerData }) {
  try {
    const deviceMakeModel = headers['x-ud-device-make-model'];

    // Perform Notification
    const notificationPayload = newDeviceFullMapper({
      firstName: customerData.firstName,
      makeModel: deviceMakeModel,
      mobileNumber: username,
      email: customerData.customerDetails.emailAddress || '',
    });
    logger.info(`[login-notification-payload] | ${JSON.stringify({ notificationPayload })}`);
    const isNewRecord = await associateDevice({ authUserId, deviceId, deviceMakeModel });
    if (isNewRecord) await Promise.all([sendSMS(notificationPayload), sendEmail(notificationPayload)]);
  } catch (e) {
    logger.debug(`[login-catch-notification] | ${JSON.stringify(e)}`);
  }
}

async function notifyTmx(headers, customerEventType, customerData) {
  // do not run notify tmx when cid is non existent
  if (customerEventType !== 'unknown_user' && !customerData?.cid) return false;

  return fraudCheck({
    tmxSessionId: headers['x-rttm-session-id'],
    webSessionId: headers['x-rttm-web-session-id'],
    appVersion: headers['x-rttm-app-version'],
    agentVersion: headers['x-rttm-agent'],
    tmxEventType: customerEventType === 'login_success' ? 'login' : 'failed_login',
    deviceIpAddress: headers['x-original-forwarded-for'] || '',
    customerEventType,
    udCustomerId: customerEventType === 'unknown_user' ? customerData : `${customerData.id}`,
    loginInformation: {
      authMethod: 'password',
    },
  });
}
