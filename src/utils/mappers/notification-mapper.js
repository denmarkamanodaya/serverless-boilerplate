module.exports.smsMapper = (data) => {
  const { template, mobileNumber } = data;
  return {
    type: 'sms',
    data,
    recipients: [mobileNumber],
    templateName: template,
    senderName: process.env.NOTIFICATION_SERVICE_SMS_SENDER_NAME,
  };
};

module.exports.smsMapperv2 = (data, templateName, recipients) => ({
  type: 'sms',
  data,
  recipients,
  templateName,
  senderName: process.env.NOTIFICATION_SERVICE_SMS_SENDER_NAME,
});

module.exports.emailMapper = (data) => {
  const { template, email } = data;
  return {
    type: 'email',
    data,
    recipients: [email],
    templateName: template,
    senderName: 'UD Notification <no-reply@uniondigitalbank.io>',
  };
};

module.exports.newDeviceFullMapper = (data) => ({
  template: process.env.NOTIFICATION_SERVICE_NEW_DEVICE_TEMPLATE_NAME,
  first_name: data.firstName,
  make_model: data.makeModel,
  device_info: data.makeModel,
  mobileNumber: data.mobileNumber,
  email: data.email,
});
