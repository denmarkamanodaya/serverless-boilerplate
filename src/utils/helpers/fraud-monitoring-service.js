const { udFraudMonitoringServiceAxiosConfig } = require('../../common/axios-config');
const { post } = require('./axios')(udFraudMonitoringServiceAxiosConfig);

module.exports.fraudCheck = async (payload) => post('/tmx/sessionQuery', payload);
