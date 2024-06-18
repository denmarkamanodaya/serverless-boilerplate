const httpStatus = require('http-status');
const { IamError } = require('../../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../../utils/response-codes');
const { udCustomerServiceAxiosConfig } = require('../../common/axios-config');
const { AxiosInterceptor } = require('../../common/axios-interceptor');
const { axiosInstance } = new AxiosInterceptor(udCustomerServiceAxiosConfig);

module.exports.verifyUser = async (mobileNumber) => {
  try {
    const { data } = await axiosInstance.post('/kyc/verify', { mobileNumber });
    return data;
  } catch (error) {
    return await _error(error);
  }
};

module.exports.getCustomerByMobile = async (mobileNumber) => {
  const result = await axiosInstance.get(`/customers/mobile/${mobileNumber}`).catch(async (error) => {
    const { data } = error.response.data;
    return await _error({ message: data.message });
  });
  return result.data;
};

const _error = async (error) => {
  throw new IamError(
    error?.message,
    error?.responseCode ? error.responseCode : httpResponseCodes.DATA_PROCESSING_ERROR.value,
    error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
  );
};
