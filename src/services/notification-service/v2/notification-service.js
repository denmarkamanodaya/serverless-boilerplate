const { UdNotificationServiceAxiosConfig } = require('../../../common/axios-config');
const { AxiosInterceptor } = require('../../../common/axios-interceptor');
const { smsMapper, emailMapper } = require('../../../utils/mappers/notification-mapper');
const logger = require('../../../utils/helpers/logger');

module.exports.sendSMS = async (body) => {
  const payload = smsMapper(body);
  const { axiosInstance } = new AxiosInterceptor(UdNotificationServiceAxiosConfig);
  const { data } = await axiosInstance.post('/notification/transactional', payload);
  logger.info(`[send-sms] | ${JSON.stringify({ body, data })}`);

  return data;
};

module.exports.sendEmail = async (body) => {
  const payload = emailMapper(body);
  const { axiosInstance } = new AxiosInterceptor(UdNotificationServiceAxiosConfig);
  try {
    const { data } = await axiosInstance.post('/notification/transactional', payload);
    logger.info(`[send-email] | ${JSON.stringify({ body, data })}`);
    return data;
  } catch (e) {
    console.log(payload, e.response.data);
  }
};
