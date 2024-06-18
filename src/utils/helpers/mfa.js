const { customOtpGen } = require('otp-gen-agent');
const { OTP_GENERATOR_MFA_CONFIG } = require('../../common/config/otp-generator-config');
const { randomUUID } = require('crypto');
const moment = require('moment');
const { ddbOtpEntityv2 } = require('../aws/dynamo-db');
const { MFA_OTP_CONFIG } = require('../../common/constants');
const { sendTransactionalNotification } = require('./notification-service');

module.exports.generateOTP = async (username, templateName, purpose) => {
  const otp = await customOtpGen(OTP_GENERATOR_MFA_CONFIG);
  const id = randomUUID();

  await Promise.all([
    ddbOtpEntityv2.put({
      dataset: MFA_OTP_CONFIG.DDB_DATASET_NAME,
      sort_key: `${username}|${otp}|${id}`,
      purpose,
      otp,
      is_used: false,
      duration: `${MFA_OTP_CONFIG.OTP_DURATION}`,
      country_code: username.substring(0, 2),
      transaction_id: id,
      mfa_token: id,
      validity_until: moment().add(MFA_OTP_CONFIG.OTP_DURATION, MFA_OTP_CONFIG.OTP_TIME_FORMAT).format(),
      created_at: moment().format(),
      updated_at: moment().format(),
    }),

    sendTransactionalNotification({
      type: 'sms',
      data: { otp },
      recipients: [username],
      templateName,
      senderName: process.env.NOTIFICATION_SERVICE_SMS_SENDER_NAME,
    }),
  ]);

  return id;
};
