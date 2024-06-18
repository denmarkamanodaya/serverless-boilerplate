const httpStatus = require('http-status');
const { IamError } = require('../../utils/custom-errors/class-errors');
const { httpResponseCodes } = require('../../utils/response-codes');
const { udCustomerServiceAxiosConfig } = require('../../common/axios-config');
const { AxiosInterceptor } = require('../../common/axios-interceptor');

class UdCustomerService extends AxiosInterceptor {
  constructor() {
    super(udCustomerServiceAxiosConfig);
  }

  async getDetails(mobileNumber) {
    try {
      const { data } = await this.axiosInstance.get(`/customers/mobile/${mobileNumber}`, {});

      return data;
    } catch (error) {
      return await this._error({ message: error.response.data.data.message });
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

module.exports = { UdCustomerService };
