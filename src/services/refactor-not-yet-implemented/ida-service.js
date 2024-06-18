const httpStatus = require('http-status');
const { IamError } = require('../../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../../utils/response-codes');
const { udIdaServiceAxiosConfig } = require('../../common/axios-config');
const { AxiosInterceptor } = require('../../common/axios-interceptor');
const { axiosInstance } = new AxiosInterceptor(udIdaServiceAxiosConfig);

module.exports.getDeviceInfo = async (sessionId) => {
  try {
    const defaultError = {
      isSessionExist: false,
      makeModel: null,
    };
    if (!sessionId) {
      return defaultError;
    }
    const response = await axiosInstance.get(`/result/${sessionId}`, {}).catch((err) => {
      return defaultError;
    });
    const deviceInfo = response.data.data.devices.MOBILE[0].properties;
    const deviceBrandModel = [deviceInfo.deviceBrand, deviceInfo.deviceModel].join('-');

    return {
      isSessionExist: true,
      makeModel: deviceBrandModel,
    };
  } catch (error) {
    return await _error(error);
  }
};

module.exports.getByUsername = async (username) => {
  const formatUsername = username.startsWith('63') ? `%2B${username}` : `%2B63${username}`;
  const response = await axiosInstance.get(`/user/getByUsername/${formatUsername}`).catch(async (error) => {
    const { data } = error.response.data;
    return data.message === 'No user/s found' ? data : await _error(error);
  });
  return response;
};

module.exports.createUserV2 = async (payload) => {
  try {
    const { data } = await axiosInstance.post('/user/createV2', payload);
    return data;
  } catch (error) {
    return await this._error(error);
  }
};

const _error = async (error) => {
  throw new IamError(
    error?.message,
    error?.responseCode ? error.responseCode : httpResponseCodes.DATA_PROCESSING_ERROR.value,
    error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
  );
};
