const httpStatus = require('http-status');
const { IamError } = require('../../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../../utils/response-codes');
const logger = require('../../utils/logger');
const { UdNotificationServiceAxiosConfig } = require('../../common/axios-config');
const { AxiosInterceptor } = require('../../common/axios-interceptor');

class UdNotificationService extends AxiosInterceptor {
  constructor() {
    super(UdNotificationServiceAxiosConfig);
  }

  async send(body) {
    try {
      const payload = {
        type: 'email',
        data: body,
        recipients: [body.email],
        templateName: body.template,
        senderName: 'UD Notification <no-reply@uniondigitalbank.io>',
      };

      const { data } = await this.axiosInstance.post('/notification/transactional', payload);

      logger.info(`[notification-service] | ${JSON.stringify(data)}`);

      return true;
    } catch (error) {
      return await this._error(error);
    }
  }

  async sendSms(body) {
    try {
      const payload = {
        type: 'sms',
        data: body,
        recipients: [body.mobileNumber],
        templateName: body.template,
        senderName: process.env.NOTIFICATION_SERVICE_SMS_SENDER_NAME,
      };

      const { data } = await this.axiosInstance.post('/notification/transactional', payload);

      logger.info(`[notification-service] | ${JSON.stringify(data)}`);

      return true;
    } catch (error) {
      return await this._error(error);
    }
  }

  async _error(error) {
    throw new IamError(
      error?.message,
      error?.responseCode ? error.responseCode : httpResponseCodes.DATA_PROCESSING_ERROR.value,
      error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

module.exports = { UdNotificationService };
