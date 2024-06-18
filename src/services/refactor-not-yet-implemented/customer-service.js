const httpStatus = require('http-status');
const { IamError } = require('../../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../../utils/response-codes');
const { udCustomerServiceAxiosConfig } = require('../../common/axios-config');
const { AxiosInterceptor } = require('../../common/axios-interceptor');

const { axiosInstance } = new AxiosInterceptor(udFraudMonitoringServiceAxiosConfig);

module.exports.getDetails = async (mobileNumber) => {
  try {
    const { data } = await axiosInstance.get(`/customers/mobile/${mobileNumber}`, {});
    return data;
  } catch (error) {
    return await _error({ message: error.response.data.data.message });
  }
};

const _error = async (error) => {
  throw new IamError(
    error?.message,
    error?.responseCode ? error.responseCode : httpResponseCodes.DATA_PROCESSING_ERROR.value,
    error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
  );
};
