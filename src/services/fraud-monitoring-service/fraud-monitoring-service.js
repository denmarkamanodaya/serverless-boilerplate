const httpStatus = require('http-status');
const { httpResponseCodes } = require('../../utils/response-codes');
const { udFraudMonitoringServiceAxiosConfig } = require('../../common/axios-config');
const { AxiosInterceptor } = require('../../common/axios-interceptor');
const logger = require('../../utils/logger');
const { axiosInstance } = new AxiosInterceptor(udFraudMonitoringServiceAxiosConfig);

const _error = async (msg, code) => {
  let err = new Error(msg);
  err.statusCode = httpStatus.FORBIDDEN;
  err.responseCode = code;
  throw err;
};

module.exports.send = async (body, error) => {
  const {
    id,
    tmxEventType: bodyTmxEventType,
    'x-rttm-session-id': tmxSessionId,
    'x-rttm-web-session-id': webSessionId,
    'x-rttm-agent': agentVersion,
    'x-rttm-app-version': appVersion,
    ip: deviceIpAddress,
    username,
    upstreamTransactionId,
  } = body;
  let tmxData;
  const tmxEventType = error ? 'failed_login' : bodyTmxEventType ? bodyTmxEventType : 'login';
  const customerEventType = error
    ? error.message === 'Mobile number does not exists.'
      ? 'unknown_user'
      : 'login_failed'
    : bodyTmxEventType
    ? forgotten_password
    : 'login_success';

  if (!tmxSessionId || !webSessionId) {
    logger.info(`[FMS Passthrough Log] Missing header/body values | ${JSON.stringify(body)}`);
    return;
  } else if (customerEventType !== 'unknown_user' && !id) {
    logger.info(`[FMS Passthrough Log] Missing customer id | ${JSON.stringify(body)}`);
    return;
  } else {
    try {
      const payload = {
        tmxSessionId,
        webSessionId,
        agentVersion,
        appVersion,
        tmxEventType,
        deviceIpAddress,
        customerEventType,
        udCustomerId: customerEventType === 'unknown_user' ? username : `${id}`,
        loginInformation: {
          authMethod: 'password',
        },
      };
      // Added for password-request
      // Basically, pop loginInformation if tmxEventType not login.
      // as error goes by: "loginInformation" is not allowed"

      if (bodyTmxEventType) {
        payload.upstreamTransactionId = upstreamTransactionId;
        delete payload['loginInformation'];
      }

      const { data } = await axiosInstance.post('/tmx/sessionQuery', payload);
      tmxData = { ...data.data, bodyTmxEventType };
      logger.info(`[FMS Response] PAYLOAD: ${JSON.stringify(payload)} | RESPONSE: ${JSON.stringify(data)}`);
    } catch (err) {
      logger.info(`[FMS Failed Request] ${JSON.stringify(err)}`);
      return;
    }
  }
  if (tmxData.disposition !== 'Allow') {
    await _error('Transaction denied by TMX', httpResponseCodes.TMX_DENY.value);
  }
  return;
};
