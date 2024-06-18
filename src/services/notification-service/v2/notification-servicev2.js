const { UdNotificationServiceAxiosConfig } = require('../../../common/axios-config');
const { AxiosInterceptor } = require('../../../common/axios-interceptor');
const { smsMapper, emailMapper } = require('../../../utils/mappers/notification-mapper');
const logger = require('../../../utils/helpers/logger');

const { axiosInstance } = new AxiosInterceptor(UdNotificationServiceAxiosConfig);

module.exports.sendSMS = async (payload) => {
  logger.info(`[send-sms-payload] | ${JSON.stringify(payload)}`);
  const { data } = await axiosInstance.post('/notification/transactional', payload);
  logger.info(`[send-sms-response] | ${JSON.stringify(data)}`);
};

// for future usage, commented due to unit test
// module.exports.sendEmail = async (payload) => {
//   logger.info(`[send-email-payload] | ${JSON.stringify(payload)}`);
//   const { data } = await axiosInstance.post('/notification/transactional', payload);
//   logger.info(`[send-email-response] | ${JSON.stringify(data)}`);
// };
