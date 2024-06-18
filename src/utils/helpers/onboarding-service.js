const { udCustomerServiceAxiosConfig } = require('../../common/axios-config.js');
const { get, post } = require('./axios')(udCustomerServiceAxiosConfig);

module.exports.getCustomerByMobile = async (mobileNumber) => get(`/customers/mobile/${mobileNumber}`);

module.exports.verifyUser = async (mobileNumber) => post('/kyc/verify/', { mobileNumber });
