const httpStatus = require('http-status');
const { IamError } = require('../../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../../utils/response-codes');
const { udIdaServiceAxiosConfig } = require('../../common/axios-config');
const { AxiosInterceptor } = require('../../common/axios-interceptor');

class UdIdaService extends AxiosInterceptor {
  constructor() {
    super(udIdaServiceAxiosConfig);
  }

  async getDeviceInfo(sessionId) {
    try {
      if (sessionId) {
        const response = await this.axiosInstance.get(`/result/${sessionId}`, {}).catch((err) => {
          return {
            isSessionExist: false,
            makeModel: null,
          };
        });

        if (!response.data) {
          return { isSessionExist: false, makeModel: null };
        }

        const deviceInfo = response.data.data.devices.MOBILE[0].properties;
        const deviceBrandModel = [deviceInfo.deviceBrand, deviceInfo.deviceModel].join('-');

        return {
          isSessionExist: true,
          makeModel: deviceBrandModel,
        };
      } else {
        return {
          isSessionExist: false,
          makeModel: null,
        };
      }
    } catch (error) {}
  }
  async getByUsername(username) {
    const formatUsername = username.startsWith('63') ? `%2B${username}` : `%2B63${username}`;

    const response = await this.axiosInstance.get(`/user/getByUsername/${formatUsername}`).catch(async (error) => {
      const { data } = error.response.data;

      if (data.message === 'No user/s found') {
        return data;
      }

      return await this._error(error);
    });

    return response;
  }
  async createUserV2(payload) {
    try {
      const { data } = await this.axiosInstance.post('/user/createV2', payload);

      return data;
    } catch (error) {
      return await this._error(error);
    }
  }

  async _error(error) {
    console.log(error);
    throw new IamError(
      error?.message,
      error?.responseCode ? error.responseCode : httpResponseCodes.DATA_PROCESSING_ERROR.value,
      error?.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

module.exports = { UdIdaService };
