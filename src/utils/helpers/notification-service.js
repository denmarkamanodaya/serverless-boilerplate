const { UdNotificationServiceAxiosConfig } = require('../../common/axios-config');
const { post } = require('./axios')(UdNotificationServiceAxiosConfig);

module.exports.sendTransactionalNotification = async (payload) => post('/notification/transactional', payload);
